/*
 * VPE publisher node
 * Copyright (C) 2018 Copter Express Technologies
 *
 * Author: Oleg Kalachev <okalachev@gmail.com>
 *
 * Distributed under MIT License (available at https://opensource.org/licenses/MIT).
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

#include <string>
#include <memory>
#include <rclcpp/rclcpp.hpp>
#include <tf2/utils.h>
#include <tf2_ros/buffer.h>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/static_transform_broadcaster.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <geometry_msgs/msg/transform_stamped.hpp>
#include <geometry_msgs/msg/quaternion.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <std_srvs/srv/trigger.hpp>

using std::string;
using namespace geometry_msgs::msg;
using std::placeholders::_1;
using std::placeholders::_2;

class VpePublisher : public rclcpp::Node
{
public:
	VpePublisher() : Node("vpe_publisher")
	{
		// Initialize tf2
		tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
		tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);
		static_transform_broadcaster_ = std::make_shared<tf2_ros::StaticTransformBroadcaster>(*this);

		// Parameters
		this->declare_parameter<string>("frame_id", ""); // name for used visual pose frame
		this->declare_parameter<string>("offset_frame_id", ""); // name for published offset frame
		this->declare_parameter<string>("local_frame_id", "map"); // mavros local_position frame_id
		this->declare_parameter<string>("child_frame_id", "base_link"); // mavros local_position tf child_frame_id
		this->declare_parameter<double>("offset_timeout", 3.0);
		this->declare_parameter<bool>("force_init", false);
		this->declare_parameter<bool>("publish_zero", false); // old name for force_init
		this->declare_parameter<double>("force_init_timeout", 5.0);
		this->declare_parameter<double>("force_init_duration", 5.0);

		frame_id_ = this->get_parameter("frame_id").as_string();
		offset_frame_id_ = this->get_parameter("offset_frame_id").as_string();
		local_frame_id_ = this->get_parameter("local_frame_id").as_string();
		child_frame_id_ = this->get_parameter("child_frame_id").as_string();
		offset_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("offset_timeout").as_double());
		
		bool force_init = this->get_parameter("force_init").as_bool() || 
		                  this->get_parameter("publish_zero").as_bool();
		double force_init_timeout = this->get_parameter("force_init_timeout").as_double();
		double force_init_duration = this->get_parameter("force_init_duration").as_double();
		
		publish_zero_timeout_ = rclcpp::Duration::from_seconds(force_init_timeout);
		publish_zero_duration_ = rclcpp::Duration::from_seconds(force_init_duration);

		if (!frame_id_.empty()) {
			RCLCPP_INFO(this->get_logger(), "using data from TF");
		} else {
			RCLCPP_INFO(this->get_logger(), "using data topic");
		}

		// Subscribers
		pose_sub_ = this->create_subscription<PoseStamped>(
			"pose", 1, std::bind(&VpePublisher::poseCallback, this, _1));
		pose_cov_sub_ = this->create_subscription<PoseWithCovarianceStamped>(
			"pose_cov", 1, std::bind(&VpePublisher::poseCovCallback, this, _1));

		// Publisher
		vpe_pub_ = this->create_publisher<PoseStamped>("vpe", 1);

		// Service
		reset_service_ = this->create_service<std_srvs::srv::Trigger>(
			"reset", std::bind(&VpePublisher::resetCallback, this, _1, _2));

		// Timer for publishing zero (if force_init is enabled)
		if (force_init) {
			// publish zero to initialize the local position
			zero_timer_ = this->create_wall_timer(
				std::chrono::milliseconds(100),
				std::bind(&VpePublisher::publishZero, this));
			local_position_sub_ = this->create_subscription<PoseStamped>(
				"mavros/local_position/pose", 1,
				std::bind(&VpePublisher::localPositionCallback, this, _1));
		}

		RCLCPP_INFO(this->get_logger(), "ready");
	}

private:
	bool reset_flag_ = true; // offset should be reset on the start
	string local_frame_id_, frame_id_, child_frame_id_, offset_frame_id_;
	std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
	std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
	std::shared_ptr<tf2_ros::StaticTransformBroadcaster> static_transform_broadcaster_;
	
	rclcpp::Publisher<PoseStamped>::SharedPtr vpe_pub_;
	rclcpp::Subscription<PoseStamped>::SharedPtr local_position_sub_;
	rclcpp::Subscription<PoseStamped>::SharedPtr pose_sub_;
	rclcpp::Subscription<PoseWithCovarianceStamped>::SharedPtr pose_cov_sub_;
	rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr reset_service_;
	rclcpp::TimerBase::SharedPtr zero_timer_;
	
	PoseStamped vpe_, pose_;
	rclcpp::Time got_local_pos_{0, 0, RCL_ROS_TIME};
	rclcpp::Duration publish_zero_timeout_, publish_zero_duration_, offset_timeout_;
	TransformStamped offset_;

	void publishZero()
	{
		auto now = this->now();
		
		// Check if we have valid VPE
		if (!(vpe_.header.stamp.sec == 0 && vpe_.header.stamp.nanosec == 0) && 
		    (now - rclcpp::Time(vpe_.header.stamp)) < publish_zero_timeout_) {
			return; // have vpe
		}

		// Check if we have local position
		if (!(pose_.header.stamp.sec == 0 && pose_.header.stamp.nanosec == 0) && 
		    (now - rclcpp::Time(pose_.header.stamp)) < publish_zero_timeout_) { // have local position
			if (got_local_pos_.nanoseconds() == 0) {
				RCLCPP_INFO(this->get_logger(), "got local position");
				got_local_pos_ = now;
			}

			if ((now - got_local_pos_) > publish_zero_duration_) {
				return; // stop publishing zero
			}
		} else {
			// lost local position
			got_local_pos_ = rclcpp::Time(0, 0, RCL_ROS_TIME);
		}

		RCLCPP_INFO_THROTTLE(this->get_logger(), *this->get_clock(), 10000, "publish zero");
		PoseStamped zero;
		zero.header.frame_id = local_frame_id_;
		zero.header.stamp = now;
		zero.pose.orientation.w = 1.0;
		vpe_pub_->publish(zero);
	}

	void localPositionCallback(const PoseStamped::SharedPtr msg)
	{
		pose_ = *msg;
	}

	inline Pose getPose(const PoseStamped::SharedPtr pose)
	{
		return pose->pose;
	}

	inline Pose getPose(const PoseWithCovarianceStamped::SharedPtr pose)
	{
		return pose->pose.pose;
	}

	inline void keepYaw(Quaternion& quaternion)
	{
		double yaw = tf2::getYaw(quaternion);
		quaternion = tf2::toMsg(tf2::Quaternion(tf2::Vector3(0, 0, 1), yaw));
	}

	void poseCallback(const PoseStamped::SharedPtr msg)
	{
		processPose(msg);
	}

	void poseCovCallback(const PoseWithCovarianceStamped::SharedPtr msg)
	{
		processPose(msg);
	}

	template <typename T>
	void processPose(const T& msg)
	{
		try {
			if (!frame_id_.empty()) {
				// get VPE transform from TF
				auto transform = tf_buffer_->lookupTransform(
					frame_id_, child_frame_id_,
					msg->header.stamp, rclcpp::Duration::from_seconds(0.02));
				vpe_.pose.position.x = transform.transform.translation.x;
				vpe_.pose.position.y = transform.transform.translation.y;
				vpe_.pose.position.z = transform.transform.translation.z;
				vpe_.pose.orientation = transform.transform.rotation;
			} else {
				vpe_.pose = getPose(msg);
			}

			// offset
			if (!offset_frame_id_.empty()) {
				auto now = this->now();
				rclcpp::Time vpe_stamp(vpe_.header.stamp);
				rclcpp::Time msg_stamp(msg->header.stamp);
				if (reset_flag_ || (msg_stamp - vpe_stamp) > offset_timeout_) {
					// calculate the offset
					if (!frame_id_.empty()) {
						// calculate from TF
						offset_ = tf_buffer_->lookupTransform(
							local_frame_id_, frame_id_,
							msg->header.stamp, rclcpp::Duration::from_seconds(0.02));
						offset_.child_frame_id = offset_frame_id_;

					} else {
						// calculate transform between pose in vpe frame and pose in local frame
						TransformStamped local_pose = tf_buffer_->lookupTransform(
							local_frame_id_, child_frame_id_,
							msg->header.stamp, rclcpp::Duration::from_seconds(0.02));
						keepYaw(local_pose.transform.rotation);

						// Convert to tf2 types for calculation
						tf2::Transform vpeTransform, poseTransform;
						// Convert Pose to Transform
						vpeTransform.setOrigin(tf2::Vector3(
							vpe_.pose.position.x,
							vpe_.pose.position.y,
							vpe_.pose.position.z));
						tf2::Quaternion vpe_q;
						tf2::fromMsg(vpe_.pose.orientation, vpe_q);
						vpeTransform.setRotation(vpe_q);
						
						// Convert Transform to tf2::Transform
						tf2::fromMsg(local_pose.transform, poseTransform);
						
						// Calculate offset
						tf2::Transform offset_tf = vpeTransform.inverse() * poseTransform;
						
						offset_.header.frame_id = local_frame_id_;
						offset_.header.stamp = msg->header.stamp;
						offset_.child_frame_id = offset_frame_id_;
						offset_.transform = tf2::toMsg(offset_tf);
					}

					static_transform_broadcaster_->sendTransform(offset_);
					reset_flag_ = false;
					RCLCPP_INFO(this->get_logger(), "offset reset");
				}
				// apply the offset
				tf2::doTransform(vpe_, vpe_, offset_);
			}

			vpe_.header.frame_id = local_frame_id_;
			vpe_.header.stamp = msg->header.stamp;
			vpe_pub_->publish(vpe_);

		} catch (const tf2::TransformException& e) {
			RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 5000, "%s", e.what());
		}
	}

	void resetCallback(
		const std::shared_ptr<std_srvs::srv::Trigger::Request> req,
		std::shared_ptr<std_srvs::srv::Trigger::Response> res)
	{
		(void)req; // unused
		reset_flag_ = true;
		res->success = true;
	}
};

int main(int argc, char **argv)
{
	rclcpp::init(argc, argv);
	rclcpp::spin(std::make_shared<VpePublisher>());
	rclcpp::shutdown();
	return 0;
}
