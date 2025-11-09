/*
 * Detecting and pose estimation of ArUco markers maps
 * Copyright (C) 2018 Copter Express Technologies
 *
 * Author: Oleg Kalachev <okalachev@gmail.com>
 *
 * Distributed under MIT License (available at https://opensource.org/licenses/MIT).
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

/*
 * Code is based on https://github.com/UbiquityRobotics/fiducials, which is distributed
 * under the BSD license.
 */

#include <math.h>
#include <string>
#include <vector>
#include <fstream>
#include <algorithm>
#include <memory>
#include <sstream>
#include <cstring>

#include <rclcpp/rclcpp.hpp>
#include <rclcpp_components/register_node_macro.hpp>
#include <image_transport/image_transport.hpp>
#include <cv_bridge/cv_bridge.h>
#include <tf2_ros/buffer.h>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/transform_broadcaster.h>
#include <tf2_ros/static_transform_broadcaster.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <message_filters/subscriber.h>
#include <message_filters/synchronizer.h>
#include <message_filters/sync_policies/exact_time.h>
#include <geometry_msgs/msg/transform_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <sensor_msgs/msg/image.hpp>
#include <sensor_msgs/msg/camera_info.hpp>
#include <visualization_msgs/msg/marker.hpp>
#include <visualization_msgs/msg/marker_array.hpp>

#include <aruco_pose/msg/marker_array.hpp>
#include <aruco_pose/msg/marker.hpp>

#include <opencv2/opencv.hpp>
#include <opencv2/aruco.hpp>

#include "draw.h"
#include "utils.h"

using std::vector;
using cv::Mat;
using sensor_msgs::msg::Image;
using sensor_msgs::msg::CameraInfo;
using aruco_pose::msg::MarkerArray;

typedef message_filters::sync_policies::ExactTime<Image, CameraInfo, MarkerArray> SyncPolicy;

class ArucoMap : public rclcpp::Node {
private:
	rclcpp::Publisher<sensor_msgs::msg::Image>::SharedPtr img_pub_;
	rclcpp::Publisher<geometry_msgs::msg::PoseWithCovarianceStamped>::SharedPtr pose_pub_;
	rclcpp::Publisher<aruco_pose::msg::MarkerArray>::SharedPtr markers_pub_;
	rclcpp::Publisher<visualization_msgs::msg::MarkerArray>::SharedPtr vis_markers_pub_;
	image_transport::Publisher debug_pub_;
	message_filters::Subscriber<Image> image_sub_;
	message_filters::Subscriber<CameraInfo> info_sub_;
	message_filters::Subscriber<MarkerArray> markers_sub_;
	std::shared_ptr<message_filters::Synchronizer<SyncPolicy>> sync_;
	cv::Ptr<cv::aruco::Board> board_;
	Mat camera_matrix_, dist_coeffs_;
	geometry_msgs::msg::TransformStamped transform_;
	geometry_msgs::msg::PoseWithCovarianceStamped pose_;
	vector<geometry_msgs::msg::TransformStamped> markers_transforms_;
	aruco_pose::msg::MarkerArray markers_;
	std::shared_ptr<tf2_ros::TransformBroadcaster> br_;
	std::shared_ptr<tf2_ros::StaticTransformBroadcaster> static_br_;
	std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
	std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
	bool enabled_ = true;
	std::string type_;
	visualization_msgs::msg::MarkerArray vis_array_;
	std::string known_vertical_, map_, markers_frame_, markers_parent_frame_;
	int image_width_, image_height_, image_margin_;
	bool flip_vertical_, auto_flip_, image_axis_, put_markers_count_to_covariance_;
	
	rclcpp::node_interfaces::OnSetParametersCallbackHandle::SharedPtr param_callback_handle_;

public:
	explicit ArucoMap(const rclcpp::NodeOptions & options = rclcpp::NodeOptions())
	: rclcpp::Node("aruco_map", options)
	{
		image_transport::ImageTransport it_priv(shared_from_this());

		img_pub_ = this->create_publisher<sensor_msgs::msg::Image>("image", rclcpp::QoS(1).transient_local());
		markers_pub_ = this->create_publisher<aruco_pose::msg::MarkerArray>("map", rclcpp::QoS(1).transient_local());

		br_ = std::make_shared<tf2_ros::TransformBroadcaster>(*this);
		static_br_ = std::make_shared<tf2_ros::StaticTransformBroadcaster>(*this);
		tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
		tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);

		board_ = cv::makePtr<cv::aruco::Board>();
		int dictionary = this->declare_parameter<int>("dictionary", 2);
		board_->dictionary = cv::aruco::getPredefinedDictionary(
			                 static_cast<cv::aruco::PREDEFINED_DICTIONARY_NAME>(dictionary));
		camera_matrix_ = cv::Mat::zeros(3, 3, CV_64F);

		type_ = this->declare_parameter<std::string>("type", "map");
		transform_.child_frame_id = this->declare_parameter<std::string>("frame_id", "aruco_map");
		std::string known_tilt;
		known_vertical_ = this->declare_parameter<std::string>("known_vertical", "");
		if (known_vertical_.empty()) {
			known_vertical_ = this->declare_parameter<std::string>("known_tilt", "");
		}
		flip_vertical_ = this->declare_parameter<bool>("flip_vertical", false);
		auto_flip_ = this->declare_parameter<bool>("auto_flip", false);
		image_width_ = this->declare_parameter<int>("image_width", 2000);
		image_height_ = this->declare_parameter<int>("image_height", 2000);
		image_margin_ = this->declare_parameter<int>("image_margin", 200);
		image_axis_ = this->declare_parameter<bool>("image_axis", true);
		put_markers_count_to_covariance_ = this->declare_parameter<bool>("put_markers_count_to_covariance", false);
		markers_parent_frame_ = this->declare_parameter<std::string>("markers.frame_id", transform_.child_frame_id);
		markers_frame_ = this->declare_parameter<std::string>("markers.child_frame_id_prefix", "");

		if (type_ == "map") {
			map_ = this->declare_parameter<std::string>("map", "");
			loadMap(map_);
		} else if (type_ == "gridboard") {
			createGridBoard();
		} else {
			RCLCPP_FATAL(this->get_logger(), "unknown type: %s", type_.c_str());
			return;
		}

		pose_pub_ = this->create_publisher<geometry_msgs::msg::PoseWithCovarianceStamped>("pose", 1);
		vis_markers_pub_ = this->create_publisher<visualization_msgs::msg::MarkerArray>("visualization", rclcpp::QoS(1).transient_local());
		debug_pub_ = it_priv.advertise("debug", 1);

		publishMap();

		image_sub_.subscribe(this, "image_raw");
		info_sub_.subscribe(this, "camera_info");
		markers_sub_.subscribe(this, "markers");

		sync_ = std::make_shared<message_filters::Synchronizer<SyncPolicy>>(
			SyncPolicy(10), image_sub_, info_sub_, markers_sub_);
		sync_->registerCallback(std::bind(&ArucoMap::callback, this, 
			std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));

		param_callback_handle_ = this->add_on_set_parameters_callback(
			std::bind(&ArucoMap::paramCallback, this, std::placeholders::_1));

		RCLCPP_INFO(this->get_logger(), "ready");
	}

	void callback(const sensor_msgs::msg::Image::ConstSharedPtr& image,
	              const sensor_msgs::msg::CameraInfo::ConstSharedPtr& cinfo,
	              const aruco_pose::msg::MarkerArray::ConstSharedPtr& markers)
	{
		if (!enabled_) return;
		if (markers->markers.empty()) return; // map not loaded

		int valid = 0;
		int count = markers->markers.size();
		std::vector<int> ids;
		std::vector<std::vector<cv::Point2f>> corners;
		cv::Vec3d rvec, tvec;

		parseCameraInfo(cinfo, camera_matrix_, dist_coeffs_);
		if (markers->markers.empty()) goto publish_debug;

		ids.reserve(count);
		corners.reserve(count);

		for(auto const &marker : markers->markers) {
			ids.push_back(marker.id);
			std::vector<cv::Point2f> marker_corners = {
				cv::Point2f(marker.c1.x, marker.c1.y),
				cv::Point2f(marker.c2.x, marker.c2.y),
				cv::Point2f(marker.c3.x, marker.c3.y),
				cv::Point2f(marker.c4.x, marker.c4.y)
			};
			corners.push_back(marker_corners);
		}

		if (put_markers_count_to_covariance_) {
			// HACK: pass markers count using covariance field
			int valid_markers = 0;
			for (auto const &marker : markers->markers) {
				for (auto const &board_marker : board_->ids) {
					if (board_marker == marker.id) {
						valid_markers++;
						break;
					}
				}
			}
			pose_.pose.covariance[0] = static_cast<double>(valid_markers);
		}

		if (known_vertical_.empty()) {
			// simple estimation
			valid = cv::aruco::estimatePoseBoard(corners, ids, board_, camera_matrix_, dist_coeffs_,
			                                     rvec, tvec, false);
			if (!valid) goto publish_debug;

			transform_.header.stamp = markers->header.stamp;
			transform_.header.frame_id = markers->header.frame_id;
			pose_.header = transform_.header;
			fillPose(pose_.pose.pose, rvec, tvec);
			fillTransform(transform_.transform, rvec, tvec);

		} else {
			Mat obj_points, img_points;
			// estimation with known vertical
			cv::aruco::getBoardObjectAndImagePoints(board_, corners, ids, obj_points, img_points);
			if (obj_points.empty()) goto publish_debug;

			double center_x = 0, center_y = 0, center_z = 0;
			alignObjPointsToCenter(obj_points, center_x, center_y, center_z);

			valid = cv::solvePnP(obj_points, img_points, camera_matrix_, dist_coeffs_, rvec, tvec, false);
			if (!valid) goto publish_debug;

			fillTransform(transform_.transform, rvec, tvec);
			try {
				geometry_msgs::msg::TransformStamped vertical = tf_buffer_->lookupTransform(markers->header.frame_id,
				                                           known_vertical_, markers->header.stamp, rclcpp::Duration::from_seconds(0.02));
				applyVertical(transform_.transform.rotation, vertical.transform.rotation, flip_vertical_, auto_flip_);
			} catch (const tf2::TransformException& e) {
				RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 1000, 
					"can't retrieve known vertical: %s", e.what());
			}

			geometry_msgs::msg::TransformStamped shift;
			shift.transform.translation.x = -center_x;
			shift.transform.translation.y = -center_y;
			shift.transform.translation.z = -center_z;
			shift.transform.rotation.w = 1.0;
			shift.transform.rotation.x = 0.0;
			shift.transform.rotation.y = 0.0;
			shift.transform.rotation.z = 0.0;
			tf2::doTransform(shift, transform_, transform_);

			// for debug topic
			tvec[0] = transform_.transform.translation.x;
			tvec[1] = transform_.transform.translation.y;
			tvec[2] = transform_.transform.translation.z;

			transform_.header.stamp = markers->header.stamp;
			transform_.header.frame_id = markers->header.frame_id;
			pose_.header = transform_.header;
			transformToPose(transform_.transform, pose_.pose.pose);
		}

		if (!transform_.child_frame_id.empty()) {
			br_->sendTransform(transform_);
		}
		pose_pub_->publish(pose_);

publish_debug:
		// publish debug image (even if no map detected)
		if (debug_pub_.getNumSubscribers() > 0) {
			Mat mat = cv_bridge::toCvCopy(image, "bgr8")->image; // copy image as we're planning to modify it
			cv::aruco::drawDetectedMarkers(mat, corners, ids); // draw detected markers
			if (valid) {
				_drawAxis(mat, camera_matrix_, dist_coeffs_, rvec, tvec, 1.0); // draw board axis
			}
			cv_bridge::CvImage out_msg;
			out_msg.header.frame_id = image->header.frame_id;
			out_msg.header.stamp = image->header.stamp;
			out_msg.encoding = sensor_msgs::image_encodings::BGR8;
			out_msg.image = mat;
			debug_pub_.publish(out_msg.toImageMsg());
		}
	}

	void alignObjPointsToCenter(Mat &obj_points, double &center_x, double &center_y, double &center_z) const
	{
		// Align object points to the center of mass
		double sum_x = 0;
		double sum_y = 0;
		double sum_z = 0;

		for (int i = 0; i < obj_points.rows; i++) {
			sum_x += obj_points.at<float>(i, 0);
			sum_y += obj_points.at<float>(i, 1);
			sum_z += obj_points.at<float>(i, 2);
		}

		center_x = sum_x / obj_points.rows;
		center_y = sum_y / obj_points.rows;
		center_z = sum_z / obj_points.rows;

		for (int i = 0; i < obj_points.rows; i++) {
			obj_points.at<float>(i, 0) -= center_x;
			obj_points.at<float>(i, 1) -= center_y;
			obj_points.at<float>(i, 2) -= center_z;
		}
	}

	void loadMap(std::string filename)
	{
		std::ifstream f(filename);
		std::string line;

		clearMarkers();

		if (map_.empty()) {
			RCLCPP_INFO(this->get_logger(), "No map loaded");
			return;
		}

		if (!f.good()) {
			RCLCPP_ERROR(this->get_logger(), "%s - %s", strerror(errno), filename.c_str());
			map_ = "";
			return;
		}

		while (std::getline(f, line)) {
			int id;
			double length, x, y, z, yaw, pitch, roll;

			std::istringstream s(line);

			// Read first character to see whether it's a comment
			char first = 0;
			if (!(s >> first)) {
				// No non-whitespace characters, must be a blank line
				continue;
			}

			if (first == '#') {
				RCLCPP_DEBUG(this->get_logger(), "Skipping line as a comment: %s", line.c_str());
				continue;
			} else if (isdigit(first)) {
				// Put the digit back into the stream
				s.putback(first);
			} else {
				// Probably garbage data; inform user and throw an exception, possibly killing nodelet
				RCLCPP_ERROR(this->get_logger(), "Malformed input: %s", line.c_str());
				map_ = "";
				clearMarkers();
				return;
			}

			if (!(s >> id >> length >> x >> y)) {
				RCLCPP_ERROR(this->get_logger(), "Not enough data in line: %s; "
				          "Each marker must have at least id, length, x, y fields", line.c_str());
				continue;
			}
			// Be less strict about z, yaw, pitch roll
			if (!(s >> z)) {
				RCLCPP_DEBUG(this->get_logger(), "No z coordinate provided for marker %d, assuming 0", id);
				z = 0;
			}
			if (!(s >> yaw)) {
				RCLCPP_DEBUG(this->get_logger(), "No yaw provided for marker %d, assuming 0", id);
				yaw = 0;
			}
			if (!(s >> pitch)) {
				RCLCPP_DEBUG(this->get_logger(), "No pitch provided for marker %d, assuming 0", id);
				pitch = 0;
			}
			if (!(s >> roll)) {
				RCLCPP_DEBUG(this->get_logger(), "No roll provided for marker %d, assuming 0", id);
				roll = 0;
			}
			addMarker(id, length, x, y, z, yaw, pitch, roll);
		}

		RCLCPP_INFO(this->get_logger(), "loading %s complete (%d markers)", filename.c_str(), static_cast<int>(board_->ids.size()));
	}

	void publishMap()
	{
		publishMarkersFrames();
		publishMarkers();
		publishMapImage();
		vis_markers_pub_->publish(vis_array_);
	}

	void createGridBoard()
	{
		RCLCPP_INFO(this->get_logger(), "generate gridboard");
		RCLCPP_WARN(this->get_logger(), "gridboard maps are deprecated");

		int markers_x = this->declare_parameter<int>("markers_x", 10);
		int markers_y = this->declare_parameter<int>("markers_y", 10);
		int first_marker = this->declare_parameter<int>("first_marker", 0);
		double markers_side, markers_sep_x, markers_sep_y;
		
		param(this, "markers_side", markers_side);
		param(this, "markers_sep_x", markers_sep_x);
		param(this, "markers_sep_y", markers_sep_y);

		std::vector<int> marker_ids;
		if (this->get_parameter("marker_ids", marker_ids)) {
			if ((unsigned int)(markers_x * markers_y) != marker_ids.size()) {
				RCLCPP_FATAL(this->get_logger(), "~marker_ids length should be equal to ~markers_x * ~markers_y");
				return;
			}
		} else {
			// Fill marker_ids automatically
			marker_ids.resize(markers_x * markers_y);
			for (int i = 0; i < markers_x * markers_y; i++)
			{
				marker_ids.at(i) = first_marker++;
			}
		}

		double max_y = markers_y * markers_side + (markers_y - 1) * markers_sep_y;
		for(int y = 0; y < markers_y; y++) {
			for(int x = 0; x < markers_x; x++) {
				double x_pos = x * (markers_side + markers_sep_x);
				double y_pos = max_y - y * (markers_side + markers_sep_y) - markers_side;
				RCLCPP_INFO(this->get_logger(), "add marker %d %g %g", marker_ids[y * markers_y + x], x_pos, y_pos);
				addMarker(marker_ids[y * markers_y + x], markers_side, x_pos, y_pos, 0, 0, 0, 0);
			}
		}
	}

	void clearMarkers()
	{
		board_->ids.clear();
		board_->objPoints.clear();
		markers_.markers.clear();
		vis_array_.markers.clear();
		markers_transforms_.clear();
	}

	void addMarker(int id, double length, double x, double y, double z,
				   double yaw, double pitch, double roll)
	{
		// Check whether the id is in range for current dictionary
		int num_markers = board_->dictionary->bytesList.rows;
		if (num_markers <= id) {
			RCLCPP_ERROR(this->get_logger(), "Marker id %d is not in dictionary; current dictionary contains %d markers. "
			              "Please see https://github.com/CopterExpress/clover/blob/master/aruco_pose/README.md#parameters for details",
					  id, num_markers);
			return;
		}
		// Check if marker is already in the board
		if (std::count(board_->ids.begin(), board_->ids.end(), id) > 0) {
			RCLCPP_ERROR(this->get_logger(), "Marker id %d is already in the map", id);
			return;
		}
		// Create transform using tf2
		tf2::Quaternion q;
		q.setRPY(roll, pitch, yaw);
		tf2::Vector3 v(x, y, z);

		/* marker's corners:
			0    1
			3    2
		*/
		double halflen = length / 2;
		tf2::Vector3 p0(-halflen, halflen, 0);
		tf2::Vector3 p1(halflen, halflen, 0);
		tf2::Vector3 p2(halflen, -halflen, 0);
		tf2::Vector3 p3(-halflen, -halflen, 0);
		
		tf2::Transform transform(q, v);
		p0 = transform * p0;
		p1 = transform * p1;
		p2 = transform * p2;
		p3 = transform * p3;

		vector<cv::Point3f> obj_points = {
			cv::Point3f(p0.x(), p0.y(), p0.z()),
			cv::Point3f(p1.x(), p1.y(), p1.z()),
			cv::Point3f(p2.x(), p2.y(), p2.z()),
			cv::Point3f(p3.x(), p3.y(), p3.z())
		};

		board_->ids.push_back(id);
		board_->objPoints.push_back(obj_points);

		// Add marker's static transform
		if (!markers_frame_.empty()) {
			geometry_msgs::msg::TransformStamped marker_transform;
			marker_transform.header.frame_id = markers_parent_frame_;
			marker_transform.child_frame_id = markers_frame_ + std::to_string(id);
			marker_transform.transform = tf2::toMsg(transform);
			markers_transforms_.push_back(marker_transform);
		}

		// Add marker to array
		aruco_pose::msg::Marker marker;
		marker.id = id;
		marker.length = length;
		marker.pose.position.x = x;
		marker.pose.position.y = y;
		marker.pose.position.z = z;
		marker.pose.orientation = tf2::toMsg(q);
		markers_.markers.push_back(marker);

		// Add visualization marker
		visualization_msgs::msg::Marker vis_marker;
		vis_marker.header.frame_id = transform_.child_frame_id;
		vis_marker.action = visualization_msgs::msg::Marker::ADD;
		vis_marker.id = static_cast<int>(vis_array_.markers.size());
		vis_marker.ns = "aruco_map_marker";
		vis_marker.type = visualization_msgs::msg::Marker::CUBE;
		vis_marker.scale.x = length;
		vis_marker.scale.y = length;
		vis_marker.scale.z = 0.001;
		vis_marker.color.r = 1.0;
		vis_marker.color.g = 0.5;
		vis_marker.color.b = 0.5;
		vis_marker.color.a = 0.8;
		vis_marker.pose.position.x = x;
		vis_marker.pose.position.y = y;
		vis_marker.pose.position.z = z;
		vis_marker.pose.orientation = tf2::toMsg(q);
		vis_marker.frame_locked = true;
		vis_array_.markers.push_back(vis_marker);
	}

	void publishMarkersFrames()
	{
		if (!markers_transforms_.empty()) {
			static_br_->sendTransform(markers_transforms_);
		}
	}

	void publishMarkers()
	{
		markers_pub_->publish(markers_);
	}

	void publishMapImage()
	{
		cv::Size size(image_width_, image_height_);
		cv::Mat image;
		cv_bridge::CvImage msg;

		if (!board_->ids.empty()) {
			_drawPlanarBoard(board_, size, image, image_margin_, 1, image_axis_);
			msg.encoding = image_axis_ ? sensor_msgs::image_encodings::RGB8 : sensor_msgs::image_encodings::MONO8;
		} else {
			// empty map
			image.create(size, CV_8UC1);
			image.setTo(cv::Scalar::all(255));
			msg.encoding = sensor_msgs::image_encodings::MONO8;
		}

		msg.image = image;
		img_pub_->publish(*msg.toImageMsg());
	}

	rcl_interfaces::msg::SetParametersResult paramCallback(const std::vector<rclcpp::Parameter> & parameters)
	{
		rcl_interfaces::msg::SetParametersResult result;
		result.successful = true;
		
		for (const auto & param : parameters) {
			if (param.get_name() == "enabled") {
				enabled_ = param.as_bool();
			} else if (param.get_name() == "map" && type_ == "map") {
				std::string new_map = param.as_string();
				if (new_map != map_) {
					map_ = new_map;
					loadMap(map_);
					publishMap();
				}
			} else if (param.get_name() == "image_axis") {
				bool new_image_axis = param.as_bool();
				if (new_image_axis != image_axis_) {
					image_axis_ = new_image_axis;
					publishMapImage();
				}
			}
		}
		
		return result;
	}
};

RCLCPP_COMPONENTS_REGISTER_NODE(ArucoMap)
