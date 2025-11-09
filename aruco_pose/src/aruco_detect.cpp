/*
 * Detecting and pose estimation of ArUco markers
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
#include <vector>
#include <string>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <memory>
#include <functional>

#include <rclcpp/rclcpp.hpp>
#include <rclcpp_components/register_node_macro.hpp>
#include <tf2_ros/buffer.h>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/transform_broadcaster.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <image_transport/image_transport.hpp>
#include <image_transport/camera_subscriber.hpp>
#include <cv_bridge/cv_bridge.h>
#include <geometry_msgs/msg/vector3.hpp>
#include <geometry_msgs/msg/pose.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <geometry_msgs/msg/transform_stamped.hpp>
#include <visualization_msgs/msg/marker.hpp>
#include <visualization_msgs/msg/marker_array.hpp>

#include <opencv2/opencv.hpp>
#include <opencv2/highgui.hpp>
#include <opencv2/aruco.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <opencv2/calib3d/calib3d.hpp>

#include <aruco_pose/msg/marker.hpp>
#include <aruco_pose/msg/marker_array.hpp>
#include <aruco_pose/srv/set_markers.hpp>

#include "draw.h"
#include "utils.h"

using std::vector;
using cv::Mat;

class ArucoDetect : public rclcpp::Node {
private:
	std::shared_ptr<tf2_ros::TransformBroadcaster> br_;
	std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
	std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
	
	bool enabled_ = true;
	cv::Ptr<cv::aruco::Dictionary> dictionary_;
	cv::Ptr<cv::aruco::DetectorParameters> parameters_;
	
	image_transport::Publisher debug_pub_;
	image_transport::CameraSubscriber img_sub_;
	std::shared_ptr<image_transport::ImageTransport> it_;
	rclcpp::Publisher<aruco_pose::msg::MarkerArray>::SharedPtr markers_pub_;
	rclcpp::Publisher<visualization_msgs::msg::MarkerArray>::SharedPtr vis_markers_pub_;
	rclcpp::Subscription<aruco_pose::msg::MarkerArray>::SharedPtr map_markers_sub_;
	rclcpp::Service<aruco_pose::srv::SetMarkers>::SharedPtr set_markers_srv_;
	
	bool estimate_poses_, send_tf_, flip_vertical_, auto_flip_, use_map_markers_;
	bool waiting_for_map_;
	double length_;
	rclcpp::Duration transform_timeout_;
	std::unordered_map<int, double> length_override_;
	std::string frame_id_prefix_, known_vertical_;
	Mat camera_matrix_, dist_coeffs_;
	aruco_pose::msg::MarkerArray array_;
	std::unordered_set<int> map_markers_ids_;
	visualization_msgs::msg::MarkerArray vis_array_;
	
	rclcpp::node_interfaces::OnSetParametersCallbackHandle::SharedPtr param_callback_handle_;

public:
	explicit ArucoDetect(const rclcpp::NodeOptions & options = rclcpp::NodeOptions())
	: rclcpp::Node("aruco_detect", options)
	{
		br_ = std::make_shared<tf2_ros::TransformBroadcaster>(*this);
		tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
		tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);

		int dictionary = this->declare_parameter<int>("dictionary", 2);
		estimate_poses_ = this->declare_parameter<bool>("estimate_poses", true);
		send_tf_ = this->declare_parameter<bool>("send_tf", true);
		use_map_markers_ = this->declare_parameter<bool>("use_map_markers", false);
		waiting_for_map_ = use_map_markers_;
		
		if (estimate_poses_) {
			if (!this->has_parameter("length")) {
				RCLCPP_FATAL(this->get_logger(), "can't estimate marker's poses as ~length parameter is not defined");
				return;
			}
			length_ = this->declare_parameter<double>("length", 0.0);
		}
		
		readLengthOverride();
		
		double transform_timeout_sec = this->declare_parameter<double>("transform_timeout", 0.02);
		transform_timeout_ = rclcpp::Duration::from_seconds(transform_timeout_sec);

		std::string known_tilt;
		known_vertical_ = this->declare_parameter<std::string>("known_vertical", "");
		if (known_vertical_.empty()) {
			known_vertical_ = this->declare_parameter<std::string>("known_tilt", "");
		}
		flip_vertical_ = this->declare_parameter<bool>("flip_vertical", false);
		auto_flip_ = this->declare_parameter<bool>("auto_flip", false);

		frame_id_prefix_ = this->declare_parameter<std::string>("frame_id_prefix", "aruco_");

		camera_matrix_ = cv::Mat::zeros(3, 3, CV_64F);

		dictionary_ = cv::aruco::getPredefinedDictionary(static_cast<cv::aruco::PREDEFINED_DICTIONARY_NAME>(dictionary));
		parameters_ = cv::aruco::DetectorParameters::create();
		
		// Initialize parameters from ROS2 parameters
		updateParameters();

		it_ = std::make_shared<image_transport::ImageTransport>(shared_from_this());
		image_transport::ImageTransport it_priv(shared_from_this());

		set_markers_srv_ = this->create_service<aruco_pose::srv::SetMarkers>(
			"set_length_override", std::bind(&ArucoDetect::setMarkers, this, 
				std::placeholders::_1, std::placeholders::_2));

		debug_pub_ = it_priv.advertise("debug", 1);
		markers_pub_ = this->create_publisher<aruco_pose::msg::MarkerArray>("markers", 1);
		vis_markers_pub_ = this->create_publisher<visualization_msgs::msg::MarkerArray>("visualization", 1);
		img_sub_ = it_->subscribeCamera("image_raw", 
			std::bind(&ArucoDetect::imageCallback, this, std::placeholders::_1, std::placeholders::_2), 
			nullptr, image_transport::TransportHints(this));
		map_markers_sub_ = this->create_subscription<aruco_pose::msg::MarkerArray>(
			"map_markers", 1, std::bind(&ArucoDetect::mapMarkersCallback, this, std::placeholders::_1));

		// Parameter callback
		param_callback_handle_ = this->add_on_set_parameters_callback(
			std::bind(&ArucoDetect::paramCallback, this, std::placeholders::_1));

		RCLCPP_INFO(this->get_logger(), "ready");
	}

private:
	void imageCallback(const sensor_msgs::msg::Image::ConstSharedPtr& msg, 
	                   const sensor_msgs::msg::CameraInfo::ConstSharedPtr &cinfo)
	{
		if (!enabled_) return;
		if (waiting_for_map_) return;

		Mat image = cv_bridge::toCvShare(msg, sensor_msgs::image_encodings::BGR8)->image;

		vector<int> ids;
		vector<vector<cv::Point2f>> corners, rejected;
		vector<cv::Vec3d> rvecs, tvecs;
		vector<cv::Point3f> obj_points;
		geometry_msgs::msg::TransformStamped vertical;

		// Detect markers
		cv::aruco::detectMarkers(image, dictionary_, corners, ids, parameters_, rejected);

		array_.header.stamp = msg->header.stamp;
		array_.header.frame_id = msg->header.frame_id;
		array_.markers.clear();

		if (ids.size() != 0) {
			parseCameraInfo(cinfo, camera_matrix_, dist_coeffs_);

			// Estimate individual markers' poses
			if (estimate_poses_) {
				cv::aruco::estimatePoseSingleMarkers(corners, length_, camera_matrix_, dist_coeffs_,
				                                     rvecs, tvecs);

				// process length override, TODO: efficiency
				if (!length_override_.empty()) {
					for (unsigned int i = 0; i < ids.size(); i++) {
						int id = ids[i];
						auto item = length_override_.find(id);
						if (item != length_override_.end()) { // found override
							vector<cv::Vec3d> rvecs_current, tvecs_current;
							vector<vector<cv::Point2f>> corners_current;
							corners_current.push_back(corners[i]);
							cv::aruco::estimatePoseSingleMarkers(corners_current, item->second,
							                                     camera_matrix_, dist_coeffs_,
										                         rvecs_current, tvecs_current);
							rvecs[i] = rvecs_current[0];
							tvecs[i] = tvecs_current[0];
						}
					}
				}

				if (!known_vertical_.empty()) {
					try {
						vertical = tf_buffer_->lookupTransform(msg->header.frame_id, known_vertical_,
						                                       msg->header.stamp, transform_timeout_);
					} catch (const tf2::TransformException& e) {
						RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 5000, 
							"can't retrieve known vertical: %s", e.what());
					}
				}
			}

			array_.markers.reserve(ids.size());
			aruco_pose::msg::Marker marker;
			vector<geometry_msgs::msg::TransformStamped> transforms;
			transforms.reserve(ids.size());
			geometry_msgs::msg::TransformStamped transform;
			transform.header.stamp = msg->header.stamp;
			transform.header.frame_id = msg->header.frame_id;

			for (unsigned int i = 0; i < ids.size(); i++) {
				marker.id = ids[i];
				marker.length = getMarkerLength(marker.id);
				fillCorners(marker, corners[i]);

				if (estimate_poses_) {
					fillPose(marker.pose, rvecs[i], tvecs[i]);

					// apply known vertical (if enabled and vertical frame available)
					if (!known_vertical_.empty() && !vertical.header.frame_id.empty()) {
						applyVertical(marker.pose.orientation, vertical.transform.rotation, false, auto_flip_);
					}

					if (send_tf_) {
						transform.child_frame_id = getChildFrameId(ids[i]);

						// check if such static transform is in the map
						if (map_markers_ids_.find(ids[i]) == map_markers_ids_.end()) {
							// check if a markers with that id is already added
							bool send = true;
							for (auto &t : transforms) {
								if (t.child_frame_id == transform.child_frame_id) {
									send = false;
									break;
								}
							}
							if (send) {
								transform.transform.rotation = marker.pose.orientation;
								fillTranslation(transform.transform.translation, tvecs[i]);
								transforms.push_back(transform);
							}
						}
					}
				}
				array_.markers.push_back(marker);
			}

			if (send_tf_) {
				br_->sendTransform(transforms);
			}
		}

		markers_pub_->publish(array_);

		// Publish visualization markers
		if (estimate_poses_ && vis_markers_pub_->get_subscription_count() > 0) {
			// Delete all markers
			visualization_msgs::msg::Marker vis_marker;
			vis_marker.action = visualization_msgs::msg::Marker::DELETEALL;
			vis_array_.markers.clear();
			vis_array_.markers.reserve(ids.size() + 1);
			vis_array_.markers.push_back(vis_marker);

			for (unsigned int i = 0; i < ids.size(); i++)
				pushVisMarkers(msg->header.frame_id, msg->header.stamp, array_.markers[i].pose,
				               getMarkerLength(ids[i]), ids[i], i);

			vis_markers_pub_->publish(vis_array_);
		}

		// Publish debug image
		if (debug_pub_.getNumSubscribers() > 0) {
			Mat debug = image.clone();
			cv::aruco::drawDetectedMarkers(debug, corners, ids); // draw markers
			if (estimate_poses_)
				for (unsigned int i = 0; i < ids.size(); i++)
					_drawAxis(debug, camera_matrix_, dist_coeffs_, rvecs[i], tvecs[i], getMarkerLength(ids[i]));

			cv_bridge::CvImage out_msg;
			out_msg.header.frame_id = msg->header.frame_id;
			out_msg.header.stamp = msg->header.stamp;
			out_msg.encoding = sensor_msgs::image_encodings::BGR8;
			out_msg.image = debug;
			debug_pub_.publish(out_msg.toImageMsg());
		}
	}

	inline void fillCorners(aruco_pose::msg::Marker& marker, const vector<cv::Point2f>& corners) const
	{
		marker.c1.x = corners[0].x;
		marker.c2.x = corners[1].x;
		marker.c3.x = corners[2].x;
		marker.c4.x = corners[3].x;
		marker.c1.y = corners[0].y;
		marker.c2.y = corners[1].y;
		marker.c3.y = corners[2].y;
		marker.c4.y = corners[3].y;
	}

	void pushVisMarkers(const std::string& frame_id, const rclcpp::Time& stamp,
	                    const geometry_msgs::msg::Pose &pose, double length, int id, int index)
	{
		visualization_msgs::msg::Marker marker;
		marker.header.frame_id = frame_id;
		marker.header.stamp = stamp;
		marker.action = visualization_msgs::msg::Marker::ADD;
		marker.id = index;

		// Marker
		marker.ns = "aruco_marker";
		marker.type = visualization_msgs::msg::Marker::CUBE;
		marker.scale.x = length;
		marker.scale.y = length;
		marker.scale.z = 0.001;
		marker.color.r = 1.0;
		marker.color.g = 1.0;
		marker.color.b = 1.0;
		marker.color.a = 0.9;
		marker.pose = pose;
		vis_array_.markers.push_back(marker);

		// Label
		marker.ns = "aruco_marker_label";
		marker.type = visualization_msgs::msg::Marker::TEXT_VIEW_FACING;
		marker.scale.z = length * 0.6;
		marker.color.r = 0.0;
		marker.color.g = 0.0;
		marker.color.b = 0.0;
		marker.color.a = 1.0;
		marker.text = std::to_string(id);
		marker.pose = pose;
		vis_array_.markers.push_back(marker);
	}

	inline std::string getChildFrameId(int id) const
	{
		return frame_id_prefix_ + std::to_string(id);
	}

	void readLengthOverride()
	{
		// Read length_override parameters (format: length_override.<id> = value)
		std::vector<std::string> prefixes = {"length_override"};
		auto result = this->list_parameters(prefixes, 0);
		for (const auto& param_name : result.names) {
			if (param_name.find("length_override.") == 0) {
				std::string id_str = param_name.substr(16); // "length_override." length
				try {
					int id = std::stoi(id_str);
					double value = this->declare_parameter<double>(param_name, 0.0);
					if (value > 0) {
						length_override_[id] = value;
					}
				} catch (...) {
					RCLCPP_WARN(this->get_logger(), "Invalid length_override parameter: %s", param_name.c_str());
				}
			}
		}
	}

	inline double getMarkerLength(int id)
	{
		auto item = length_override_.find(id);
		if (item != length_override_.end()) {
			return item->second;
		} else {
			return length_;
		}
	}

	void setMarkers(const std::shared_ptr<aruco_pose::srv::SetMarkers::Request> req,
	                std::shared_ptr<aruco_pose::srv::SetMarkers::Response> res)
	{
		for (auto const& marker : req->markers) {
			if (marker.id > 999) {
				res->message = "Invalid marker id: " + std::to_string(marker.id);
				RCLCPP_ERROR(this->get_logger(), "%s", res->message.c_str());
				res->success = false;
				return;
			}
			if (!std::isfinite(marker.length) || marker.length <= 0) {
				res->message = "Invalid marker " + std::to_string(marker.id) + " length: " + std::to_string(marker.length);
				RCLCPP_ERROR(this->get_logger(), "%s", res->message.c_str());
				res->success = false;
				return;
			}
		}

		for (auto const& marker : req->markers) {
			length_override_[marker.id] = marker.length;
		}

		res->success = true;
	}

	void mapMarkersCallback(const aruco_pose::msg::MarkerArray::SharedPtr msg)
	{
		map_markers_ids_.clear();
		for (auto const& marker : msg->markers) {
			map_markers_ids_.insert(marker.id);
			if (use_map_markers_) {
				if (length_override_.find(marker.id) == length_override_.end()) {
					length_override_[marker.id] = marker.length;
				}
			}
		}
		waiting_for_map_ = false;
	}

	rcl_interfaces::msg::SetParametersResult paramCallback(const std::vector<rclcpp::Parameter> & parameters)
	{
		rcl_interfaces::msg::SetParametersResult result;
		result.successful = true;
		
		for (const auto & param : parameters) {
			if (param.get_name() == "enabled") {
				enabled_ = param.as_bool() && length_ > 0;
			} else if (param.get_name() == "length") {
				length_ = param.as_double();
				enabled_ = enabled_ && length_ > 0;
			} else {
				updateParameters();
			}
		}
		
		return result;
	}

	void updateParameters()
	{
		parameters_->adaptiveThreshConstant = this->declare_parameter<double>("adaptiveThreshConstant", parameters_->adaptiveThreshConstant);
		parameters_->adaptiveThreshWinSizeMin = this->declare_parameter<int>("adaptiveThreshWinSizeMin", parameters_->adaptiveThreshWinSizeMin);
		parameters_->adaptiveThreshWinSizeMax = this->declare_parameter<int>("adaptiveThreshWinSizeMax", parameters_->adaptiveThreshWinSizeMax);
		parameters_->adaptiveThreshWinSizeStep = this->declare_parameter<int>("adaptiveThreshWinSizeStep", parameters_->adaptiveThreshWinSizeStep);
		parameters_->cornerRefinementMaxIterations = this->declare_parameter<int>("cornerRefinementMaxIterations", parameters_->cornerRefinementMaxIterations);
		parameters_->cornerRefinementMethod = this->declare_parameter<int>("cornerRefinementMethod", parameters_->cornerRefinementMethod);
		parameters_->cornerRefinementMinAccuracy = this->declare_parameter<double>("cornerRefinementMinAccuracy", parameters_->cornerRefinementMinAccuracy);
		parameters_->cornerRefinementWinSize = this->declare_parameter<int>("cornerRefinementWinSize", parameters_->cornerRefinementWinSize);
#if ((CV_VERSION_MAJOR == 3) && (CV_VERSION_MINOR >= 4) && (CV_VERSION_REVISION >= 7)) || (CV_VERSION_MAJOR > 3)
		parameters_->detectInvertedMarker = this->declare_parameter<bool>("detectInvertedMarker", false);
#endif
		parameters_->errorCorrectionRate = this->declare_parameter<double>("errorCorrectionRate", parameters_->errorCorrectionRate);
		parameters_->minCornerDistanceRate = this->declare_parameter<double>("minCornerDistanceRate", parameters_->minCornerDistanceRate);
		parameters_->markerBorderBits = this->declare_parameter<int>("markerBorderBits", parameters_->markerBorderBits);
		parameters_->maxErroneousBitsInBorderRate = this->declare_parameter<double>("maxErroneousBitsInBorderRate", parameters_->maxErroneousBitsInBorderRate);
		parameters_->minDistanceToBorder = this->declare_parameter<int>("minDistanceToBorder", parameters_->minDistanceToBorder);
		parameters_->minMarkerDistanceRate = this->declare_parameter<double>("minMarkerDistanceRate", parameters_->minMarkerDistanceRate);
		parameters_->minMarkerPerimeterRate = this->declare_parameter<double>("minMarkerPerimeterRate", parameters_->minMarkerPerimeterRate);
		parameters_->maxMarkerPerimeterRate = this->declare_parameter<double>("maxMarkerPerimeterRate", parameters_->maxMarkerPerimeterRate);
		parameters_->minOtsuStdDev = this->declare_parameter<double>("minOtsuStdDev", parameters_->minOtsuStdDev);
		parameters_->perspectiveRemoveIgnoredMarginPerCell = this->declare_parameter<double>("perspectiveRemoveIgnoredMarginPerCell", parameters_->perspectiveRemoveIgnoredMarginPerCell);
		parameters_->perspectiveRemovePixelPerCell = this->declare_parameter<int>("perspectiveRemovePixelPerCell", parameters_->perspectiveRemovePixelPerCell);
		parameters_->polygonalApproxAccuracyRate = this->declare_parameter<double>("polygonalApproxAccuracyRate", parameters_->polygonalApproxAccuracyRate);
#if ((CV_VERSION_MAJOR == 3) && (CV_VERSION_MINOR >= 4) && (CV_VERSION_REVISION >= 2)) || (CV_VERSION_MAJOR > 3)
		parameters_->aprilTagQuadDecimate = this->declare_parameter<double>("aprilTagQuadDecimate", 0.0);
		parameters_->aprilTagQuadSigma = this->declare_parameter<double>("aprilTagQuadSigma", 0.0);
#endif
		enabled_ = this->declare_parameter<bool>("enabled", true) && length_ > 0;
	}
};

RCLCPP_COMPONENTS_REGISTER_NODE(ArucoDetect)
