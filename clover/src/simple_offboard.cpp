/*
 * Simplified copter control in OFFBOARD mode
 * Copyright (C) 2019 Copter Express Technologies
 *
 * Author: Oleg Kalachev <okalachev@gmail.com>
 *
 * Distributed under MIT License (available at https://opensource.org/licenses/MIT).
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

#include <algorithm>
#include <string>
#include <cmath>
#include <stdexcept>
#include <memory>
#include <GeographicLib/Geodesic.hpp>
#include <rclcpp/rclcpp.hpp>
#include <tf2/utils.h>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/transform_broadcaster.h>
#include <tf2_ros/static_transform_broadcaster.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <geometry_msgs/msg/point_stamped.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <geometry_msgs/msg/vector3_stamped.hpp>
#include <geometry_msgs/msg/quaternion_stamped.hpp>
#include <sensor_msgs/msg/nav_sat_fix.hpp>
#include <sensor_msgs/msg/battery_state.hpp>
#include <sensor_msgs/msg/range.hpp>
#include <mavros_msgs/srv/command_bool.hpp>
#include <mavros_msgs/srv/set_mode.hpp>
#include <mavros_msgs/msg/position_target.hpp>
#include <mavros_msgs/msg/attitude_target.hpp>
#include <mavros_msgs/msg/thrust.hpp>
#include <mavros_msgs/msg/state.hpp>
#include <mavros_msgs/msg/status_text.hpp>
#include <mavros_msgs/msg/manual_control.hpp>
#include <mavros_msgs/msg/altitude.hpp>

#include <clover/srv/get_telemetry.hpp>
#include <clover/srv/navigate.hpp>
#include <clover/srv/navigate_global.hpp>
#include <clover/srv/set_altitude.hpp>
#include <clover/srv/set_yaw.hpp>
#include <clover/srv/set_yaw_rate.hpp>
#include <clover/srv/set_position.hpp>
#include <clover/srv/set_velocity.hpp>
#include <clover/srv/set_attitude.hpp>
#include <clover/srv/set_rates.hpp>
#include <clover/msg/state.hpp>

using std::string;
using std::isnan;
using namespace geometry_msgs::msg;
using namespace sensor_msgs::msg;
using namespace clover;
using mavros_msgs::msg::PositionTarget;
using mavros_msgs::msg::AttitudeTarget;
using mavros_msgs::msg::Thrust;
using mavros_msgs::msg::Altitude;

class SimpleOffboard : public rclcpp::Node
{
public:
	SimpleOffboard() : Node("simple_offboard")
	{
		// Initialize tf2
		tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
		tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);
		transform_broadcaster_ = std::make_shared<tf2_ros::TransformBroadcaster>(*this);
		static_transform_broadcaster_ = std::make_shared<tf2_ros::StaticTransformBroadcaster>(*this);

		// Parameters
		this->declare_parameter("mavros", "mavros");
		this->declare_parameter("target_frame", "navigate_target");
		this->declare_parameter("setpoint", "setpoint");
		this->declare_parameter("auto_release", true);
		this->declare_parameter("land_only_in_offboard", true);
		this->declare_parameter("nav_from_sp", true);
		this->declare_parameter("check_kill_switch", true);
		this->declare_parameter("default_speed", 0.5);
		this->declare_parameter("body_frame", "body");
		this->declare_parameter("terrain_frame", "terrain");
		this->declare_parameter("terrain_frame_mode", "altitude");
		this->declare_parameter("state_timeout", 3.0);
		this->declare_parameter("local_position_timeout", 2.0);
		this->declare_parameter("velocity_timeout", 2.0);
		this->declare_parameter("global_position_timeout", 10.0);
		this->declare_parameter("battery_timeout", 2.0);
		this->declare_parameter("manual_control_timeout", 0.0);
		this->declare_parameter("transform_timeout", 0.5);
		this->declare_parameter("telemetry_transform_timeout", 0.5);
		this->declare_parameter("offboard_timeout", 3.0);
		this->declare_parameter("land_timeout", 3.0);
		this->declare_parameter("arming_timeout", 4.0);
		this->declare_parameter("setpoint_rate", 30.0);

		mavros_ = this->get_parameter("mavros").as_string();
		target_.child_frame_id = this->get_parameter("target_frame").as_string();
		setpoint_.child_frame_id = this->get_parameter("setpoint").as_string();
		auto_release_ = this->get_parameter("auto_release").as_bool();
		land_only_in_offboard_ = this->get_parameter("land_only_in_offboard").as_bool();
		nav_from_sp_ = this->get_parameter("nav_from_sp").as_bool();
		check_kill_switch_ = this->get_parameter("check_kill_switch").as_bool();
		default_speed_ = this->get_parameter("default_speed").as_double();
		body_.child_frame_id = this->get_parameter("body_frame").as_string();
		terrain_.child_frame_id = this->get_parameter("terrain_frame").as_string();
		terrain_frame_mode_ = this->get_parameter("terrain_frame_mode").as_string();

		// Get local_frame and fcu_frame from parameters (can be set via launch file)
		this->declare_parameter("local_frame", "map");
		this->declare_parameter("fcu_frame", "base_link");
		local_frame_ = this->get_parameter("local_frame").as_string();
		fcu_frame_ = this->get_parameter("fcu_frame").as_string();

		// Get reference_frames parameter
		this->declare_parameter("reference_frames", std::map<string, string>());
		reference_frames_ = this->get_parameter("reference_frames").as_string_map();

		// Default reference frames
		std::map<string, string> default_reference_frames;
		default_reference_frames[body_.child_frame_id] = local_frame_;
		default_reference_frames[fcu_frame_] = local_frame_;
		if (!target_.child_frame_id.empty()) {
			default_reference_frames[target_.child_frame_id] = local_frame_;
		}
		reference_frames_.insert(default_reference_frames.begin(), default_reference_frames.end());

		// Timeouts
		state_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("state_timeout").as_double());
		local_position_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("local_position_timeout").as_double());
		velocity_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("velocity_timeout").as_double());
		global_position_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("global_position_timeout").as_double());
		battery_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("battery_timeout").as_double());
		manual_control_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("manual_control_timeout").as_double());
		transform_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("transform_timeout").as_double());
		telemetry_transform_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("telemetry_transform_timeout").as_double());
		offboard_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("offboard_timeout").as_double());
		land_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("land_timeout").as_double());
		arming_timeout_ = rclcpp::Duration::from_seconds(this->get_parameter("arming_timeout").as_double());

		// Service clients
		arming_client_ = this->create_client<mavros_msgs::srv::CommandBool>(mavros_ + "/cmd/arming");
		set_mode_client_ = this->create_client<mavros_msgs::srv::SetMode>(mavros_ + "/set_mode");

		// Telemetry subscribers
		state_sub_ = this->create_subscription<mavros_msgs::msg::State>(
			mavros_ + "/state", 1,
			std::bind(&SimpleOffboard::handleState, this, std::placeholders::_1));
		velocity_sub_ = this->create_subscription<TwistStamped>(
			mavros_ + "/local_position/velocity_body", 1,
			std::bind(&SimpleOffboard::handleMessage<TwistStamped>, this, std::placeholders::_1));
		global_position_sub_ = this->create_subscription<NavSatFix>(
			mavros_ + "/global_position/global", 1,
			std::bind(&SimpleOffboard::handleMessage<NavSatFix>, this, std::placeholders::_1));
		battery_sub_ = this->create_subscription<BatteryState>(
			mavros_ + "/battery", 1,
			std::bind(&SimpleOffboard::handleMessage<BatteryState>, this, std::placeholders::_1));
		statustext_sub_ = this->create_subscription<mavros_msgs::msg::StatusText>(
			mavros_ + "/statustext/recv", 1,
			std::bind(&SimpleOffboard::handleMessage<mavros_msgs::msg::StatusText>, this, std::placeholders::_1));
		manual_control_sub_ = this->create_subscription<mavros_msgs::msg::ManualControl>(
			mavros_ + "/manual_control/control", 1,
			std::bind(&SimpleOffboard::handleMessage<mavros_msgs::msg::ManualControl>, this, std::placeholders::_1));
		local_position_sub_ = this->create_subscription<PoseStamped>(
			mavros_ + "/local_position/pose", 1,
			std::bind(&SimpleOffboard::handleLocalPosition, this, std::placeholders::_1));

		// Altitude/Range subscriber
		if (!body_.child_frame_id.empty() && !terrain_.child_frame_id.empty()) {
			terrain_.header.frame_id = local_frame_;
			if (terrain_frame_mode_ == "altitude") {
				altitude_sub_ = this->create_subscription<Altitude>(
					mavros_ + "/altitude", 1,
					std::bind(&SimpleOffboard::handleAltitude, this, std::placeholders::_1));
			} else if (terrain_frame_mode_ == "range") {
				this->declare_parameter("range_topic", "rangefinder/range");
				string range_topic = this->get_parameter("range_topic").as_string();
				altitude_sub_ = this->create_subscription<sensor_msgs::msg::Range>(
					range_topic, 1,
					std::bind(&SimpleOffboard::handleRange, this, std::placeholders::_1));
			} else {
				RCLCPP_FATAL(this->get_logger(), "Unknown terrain_frame_mode: %s, valid values: altitude, range", terrain_frame_mode_.c_str());
				rclcpp::shutdown();
			}
		}

		// Setpoint publishers
		position_pub_ = this->create_publisher<PoseStamped>(mavros_ + "/setpoint_position/local", 1);
		position_raw_pub_ = this->create_publisher<PositionTarget>(mavros_ + "/setpoint_raw/local", 1);
		attitude_pub_ = this->create_publisher<PoseStamped>(mavros_ + "/setpoint_attitude/attitude", 1);
		attitude_raw_pub_ = this->create_publisher<AttitudeTarget>(mavros_ + "/setpoint_raw/attitude", 1);
		rates_pub_ = this->create_publisher<TwistStamped>(mavros_ + "/setpoint_attitude/cmd_vel", 1);
		thrust_pub_ = this->create_publisher<Thrust>(mavros_ + "/setpoint_attitude/thrust", 1);

		// State publisher
		state_pub_ = this->create_publisher<clover::msg::State>("state", rclcpp::QoS(1).transient_local());

		// Service servers
		get_telemetry_srv_ = this->create_service<clover::srv::GetTelemetry>(
			"get_telemetry",
			std::bind(&SimpleOffboard::getTelemetry, this, std::placeholders::_1, std::placeholders::_2));
		navigate_srv_ = this->create_service<clover::srv::Navigate>(
			"navigate",
			std::bind(&SimpleOffboard::navigate, this, std::placeholders::_1, std::placeholders::_2));
		navigate_global_srv_ = this->create_service<clover::srv::NavigateGlobal>(
			"navigate_global",
			std::bind(&SimpleOffboard::navigateGlobal, this, std::placeholders::_1, std::placeholders::_2));
		set_altitude_srv_ = this->create_service<clover::srv::SetAltitude>(
			"set_altitude",
			std::bind(&SimpleOffboard::setAltitude, this, std::placeholders::_1, std::placeholders::_2));
		set_yaw_srv_ = this->create_service<clover::srv::SetYaw>(
			"set_yaw",
			std::bind(&SimpleOffboard::setYaw, this, std::placeholders::_1, std::placeholders::_2));
		set_yaw_rate_srv_ = this->create_service<clover::srv::SetYawRate>(
			"set_yaw_rate",
			std::bind(&SimpleOffboard::setYawRate, this, std::placeholders::_1, std::placeholders::_2));
		set_position_srv_ = this->create_service<clover::srv::SetPosition>(
			"set_position",
			std::bind(&SimpleOffboard::setPosition, this, std::placeholders::_1, std::placeholders::_2));
		set_velocity_srv_ = this->create_service<clover::srv::SetVelocity>(
			"set_velocity",
			std::bind(&SimpleOffboard::setVelocity, this, std::placeholders::_1, std::placeholders::_2));
		set_attitude_srv_ = this->create_service<clover::srv::SetAttitude>(
			"set_attitude",
			std::bind(&SimpleOffboard::setAttitude, this, std::placeholders::_1, std::placeholders::_2));
		set_rates_srv_ = this->create_service<clover::srv::SetRates>(
			"set_rates",
			std::bind(&SimpleOffboard::setRates, this, std::placeholders::_1, std::placeholders::_2));
		land_srv_ = this->create_service<std_srvs::srv::Trigger>(
			"land",
			std::bind(&SimpleOffboard::land, this, std::placeholders::_1, std::placeholders::_2));
		release_srv_ = this->create_service<std_srvs::srv::Trigger>(
			"release",
			std::bind(&SimpleOffboard::release, this, std::placeholders::_1, std::placeholders::_2));

		// Setpoint timer
		double setpoint_rate = this->get_parameter("setpoint_rate").as_double();
		setpoint_timer_ = this->create_wall_timer(
			std::chrono::milliseconds(static_cast<int>(1000.0 / setpoint_rate)),
			std::bind(&SimpleOffboard::publishSetpoint, this));

		position_msg_.header.frame_id = local_frame_;
		position_raw_msg_.header.frame_id = local_frame_;
		position_raw_msg_.coordinate_frame = PositionTarget::FRAME_LOCAL_NED;

		RCLCPP_INFO(this->get_logger(), "ready");
	}

private:
	// tf2
	std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
	std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
	std::shared_ptr<tf2_ros::TransformBroadcaster> transform_broadcaster_;
	std::shared_ptr<tf2_ros::StaticTransformBroadcaster> static_transform_broadcaster_;

	// Parameters
	string mavros_;
	string local_frame_;
	string fcu_frame_;
	rclcpp::Duration transform_timeout_;
	rclcpp::Duration telemetry_transform_timeout_;
	rclcpp::Duration offboard_timeout_;
	rclcpp::Duration land_timeout_;
	rclcpp::Duration arming_timeout_;
	rclcpp::Duration local_position_timeout_;
	rclcpp::Duration state_timeout_;
	rclcpp::Duration velocity_timeout_;
	rclcpp::Duration global_position_timeout_;
	rclcpp::Duration battery_timeout_;
	rclcpp::Duration manual_control_timeout_;
	float default_speed_;
	bool auto_release_;
	bool land_only_in_offboard_, nav_from_sp_, check_kill_switch_;
	std::map<string, string> reference_frames_;
	string terrain_frame_mode_;

	// Publishers
	rclcpp::Publisher<PoseStamped>::SharedPtr attitude_pub_, position_pub_;
	rclcpp::Publisher<PositionTarget>::SharedPtr position_raw_pub_;
	rclcpp::Publisher<AttitudeTarget>::SharedPtr attitude_raw_pub_;
	rclcpp::Publisher<TwistStamped>::SharedPtr rates_pub_;
	rclcpp::Publisher<Thrust>::SharedPtr thrust_pub_;
	rclcpp::Publisher<clover::msg::State>::SharedPtr state_pub_;

	// Service clients
	rclcpp::Client<mavros_msgs::srv::CommandBool>::SharedPtr arming_client_;
	rclcpp::Client<mavros_msgs::srv::SetMode>::SharedPtr set_mode_client_;

	// Subscribers
	rclcpp::Subscription<mavros_msgs::msg::State>::SharedPtr state_sub_;
	rclcpp::Subscription<TwistStamped>::SharedPtr velocity_sub_;
	rclcpp::Subscription<NavSatFix>::SharedPtr global_position_sub_;
	rclcpp::Subscription<BatteryState>::SharedPtr battery_sub_;
	rclcpp::Subscription<mavros_msgs::msg::StatusText>::SharedPtr statustext_sub_;
	rclcpp::Subscription<mavros_msgs::msg::ManualControl>::SharedPtr manual_control_sub_;
	rclcpp::Subscription<PoseStamped>::SharedPtr local_position_sub_;
	rclcpp::SubscriptionBase::SharedPtr altitude_sub_;

	// Service servers
	rclcpp::Service<clover::srv::GetTelemetry>::SharedPtr get_telemetry_srv_;
	rclcpp::Service<clover::srv::Navigate>::SharedPtr navigate_srv_;
	rclcpp::Service<clover::srv::NavigateGlobal>::SharedPtr navigate_global_srv_;
	rclcpp::Service<clover::srv::SetAltitude>::SharedPtr set_altitude_srv_;
	rclcpp::Service<clover::srv::SetYaw>::SharedPtr set_yaw_srv_;
	rclcpp::Service<clover::srv::SetYawRate>::SharedPtr set_yaw_rate_srv_;
	rclcpp::Service<clover::srv::SetPosition>::SharedPtr set_position_srv_;
	rclcpp::Service<clover::srv::SetVelocity>::SharedPtr set_velocity_srv_;
	rclcpp::Service<clover::srv::SetAttitude>::SharedPtr set_attitude_srv_;
	rclcpp::Service<clover::srv::SetRates>::SharedPtr set_rates_srv_;
	rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr land_srv_;
	rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr release_srv_;

	// Timer
	rclcpp::TimerBase::SharedPtr setpoint_timer_;

	// Containers
	PoseStamped position_msg_;
	PositionTarget position_raw_msg_;
	TransformStamped target_, setpoint_;
	geometry_msgs::msg::TransformStamped body_;
	geometry_msgs::msg::TransformStamped terrain_;

	// State
	PoseStamped nav_start_;
	PointStamped setpoint_position_;
	PointStamped setpoint_altitude_;
	Vector3Stamped setpoint_velocity_;
	float setpoint_yaw_, setpoint_roll_, setpoint_pitch_;
	Vector3 setpoint_rates_;
	string yaw_frame_id_;
	float setpoint_thrust_;
	float nav_speed_;
	float setpoint_lat_ = NAN, setpoint_lon_ = NAN;
	bool busy_ = false;
	bool wait_armed_ = false;
	bool nav_from_sp_flag_ = false;

	// Last published
	PoseStamped setpoint_pose_local_;
	Vector3Stamped setpoint_velocity_local_;
	float yaw_local_;

	enum setpoint_type_t {
		NONE,
		NAVIGATE,
		NAVIGATE_GLOBAL,
		POSITION,
		VELOCITY,
		ATTITUDE,
		RATES,
		_ALTITUDE,
		_YAW,
		_YAW_RATE,
	};

	enum setpoint_type_t setpoint_type_ = NONE;

	enum { YAW, YAW_RATE, TOWARDS } setpoint_yaw_type_;

	// Last received telemetry messages
	mavros_msgs::msg::State state_;
	mavros_msgs::msg::StatusText statustext_;
	mavros_msgs::msg::ManualControl manual_control_;
	PoseStamped local_position_;
	TwistStamped velocity_;
	NavSatFix global_position_;
	BatteryState battery_;

	// Common subscriber callback template that stores message to the variable
	template<typename T>
	void handleMessage(const typename T::SharedPtr msg)
	{
		if constexpr (std::is_same_v<T, TwistStamped>) {
			velocity_ = *msg;
		} else if constexpr (std::is_same_v<T, NavSatFix>) {
			global_position_ = *msg;
		} else if constexpr (std::is_same_v<T, BatteryState>) {
			battery_ = *msg;
		} else if constexpr (std::is_same_v<T, mavros_msgs::msg::StatusText>) {
			statustext_ = *msg;
		} else if constexpr (std::is_same_v<T, mavros_msgs::msg::ManualControl>) {
			manual_control_ = *msg;
		}
	}

	void handleState(const mavros_msgs::msg::State::SharedPtr s)
	{
		state_ = *s;
		if (s->mode != "OFFBOARD") {
			// flight intercepted
			nav_from_sp_flag_ = false;
		}
	}

	inline void publishBodyFrame()
	{
		if (body_.child_frame_id.empty()) return;
		if (body_.header.stamp.sec != 0 || body_.header.stamp.nanosec != 0) {
			if (body_.header.stamp == local_position_.header.stamp) {
				return; // avoid TF_REPEATED_DATA warnings
			}
		}

		tf2::Quaternion q;
		q.setRPY(0, 0, tf2::getYaw(local_position_.pose.orientation));
		body_.transform.rotation = tf2::toMsg(q);

		body_.transform.translation.x = local_position_.pose.position.x;
		body_.transform.translation.y = local_position_.pose.position.y;
		body_.transform.translation.z = local_position_.pose.position.z;
		body_.header.frame_id = local_position_.header.frame_id;
		body_.header.stamp = local_position_.header.stamp;
		transform_broadcaster_->sendTransform(body_);
	}

	void handleLocalPosition(const PoseStamped::SharedPtr pose)
	{
		local_position_ = *pose;
		publishBodyFrame();
		// TODO: home?
	}

	// wait for transform without interrupting publishing setpoints
	inline bool waitTransform(const string& target, const string& source,
	                          const rclcpp::Time& stamp, const rclcpp::Duration& timeout)
	{
		rclcpp::Rate r(100, this->get_clock());
		auto start = this->now();
		while (rclcpp::ok()) {
			if (this->now() - start > timeout) return false;
			if (tf_buffer_->canTransform(target, source, stamp)) return true;
			rclcpp::spin_some(this->shared_from_this());
			r.sleep();
		}
		return false;
	}

	void publishTerrain(const double distance, const rclcpp::Time& stamp)
	{
		if (!waitTransform(local_frame_, body_.child_frame_id, stamp, rclcpp::Duration::from_seconds(0.1))) return;

		auto t = tf_buffer_->lookupTransform(local_frame_, body_.child_frame_id, stamp);
		t.child_frame_id = terrain_.child_frame_id;
		t.transform.translation.z -= distance;
		static_transform_broadcaster_->sendTransform(t);
	}

	void handleAltitude(const Altitude::SharedPtr alt)
	{
		if (!std::isfinite(alt->bottom_clearance)) return;
		publishTerrain(alt->bottom_clearance, rclcpp::Time(alt->header.stamp));
	}

	void handleRange(const sensor_msgs::msg::Range::SharedPtr range)
	{
		if (!std::isfinite(range->range)) return;
		// TODO: check it's facing down
		publishTerrain(range->range, rclcpp::Time(range->header.stamp));
	}

	#define TIMEOUT(msg, timeout) (msg.header.stamp.sec == 0 && msg.header.stamp.nanosec == 0) || \
	                              (this->now() - rclcpp::Time(msg.header.stamp) > timeout)

	void getTelemetry(
		const std::shared_ptr<clover::srv::GetTelemetry::Request> req,
		std::shared_ptr<clover::srv::GetTelemetry::Response> res)
	{
		rclcpp::Time stamp = this->now();

		if (req->frame_id.empty())
			req->frame_id = local_frame_;

		res->frame_id = req->frame_id;
		res->x = NAN;
		res->y = NAN;
		res->z = NAN;
		res->lat = NAN;
		res->lon = NAN;
		res->alt = NAN;
		res->vx = NAN;
		res->vy = NAN;
		res->vz = NAN;
		res->roll = NAN;
		res->pitch = NAN;
		res->yaw = NAN;
		res->roll_rate = NAN;
		res->pitch_rate = NAN;
		res->yaw_rate = NAN;
		res->voltage = NAN;
		res->cell_voltage = NAN;

		if (!TIMEOUT(state_, state_timeout_)) {
			res->connected = state_.connected;
			res->armed = state_.armed;
			res->mode = state_.mode;
		}

		try {
			waitTransform(req->frame_id, fcu_frame_, stamp, telemetry_transform_timeout_);
			auto transform = tf_buffer_->lookupTransform(req->frame_id, fcu_frame_, stamp);
			res->x = transform.transform.translation.x;
			res->y = transform.transform.translation.y;
			res->z = transform.transform.translation.z;

			double yaw, pitch, roll;
			tf2::getEulerYPR(transform.transform.rotation, yaw, pitch, roll);
			res->yaw = yaw;
			res->pitch = pitch;
			res->roll = roll;
		} catch (const tf2::TransformException& e) {
			RCLCPP_DEBUG(this->get_logger(), "%s", e.what());
		}

		if (!TIMEOUT(velocity_, velocity_timeout_)) {
			try {
				// transform velocity
				waitTransform(req->frame_id, velocity_.header.frame_id, rclcpp::Time(velocity_.header.stamp), telemetry_transform_timeout_);
				Vector3Stamped vec, vec_out;
				vec.header.stamp = velocity_.header.stamp;
				vec.header.frame_id = velocity_.header.frame_id;
				vec.vector = velocity_.twist.linear;
				auto transform = tf_buffer_->lookupTransform(req->frame_id, velocity_.header.frame_id, rclcpp::Time(velocity_.header.stamp));
				tf2::doTransform(vec, vec_out, transform);

				res->vx = vec_out.vector.x;
				res->vy = vec_out.vector.y;
				res->vz = vec_out.vector.z;
			} catch (const tf2::TransformException& e) {}

			// use angular velocities as they are
			res->yaw_rate = velocity_.twist.angular.z;
			res->pitch_rate = velocity_.twist.angular.y;
			res->roll_rate = velocity_.twist.angular.x;
		}

		if (!TIMEOUT(global_position_, global_position_timeout_)) {
			res->lat = global_position_.latitude;
			res->lon = global_position_.longitude;
			res->alt = global_position_.altitude;
		}

		if (!TIMEOUT(battery_, battery_timeout_)) {
			res->voltage = battery_.voltage;
			if (!battery_.cell_voltage.empty()) {
				res->cell_voltage = battery_.cell_voltage[0];
			}
		}
	}

	// throws std::runtime_error
	void offboardAndArm()
	{
		rclcpp::Rate r(10, this->get_clock());

		if (state_.mode != "OFFBOARD") {
			auto start = this->now();
			RCLCPP_INFO(this->get_logger(), "switch to OFFBOARD");
			auto request = std::make_shared<mavros_msgs::srv::SetMode::Request>();
			request->custom_mode = "OFFBOARD";

			if (!set_mode_client_->wait_for_service(std::chrono::seconds(1))) {
				throw std::runtime_error("set_mode service not available");
			}

			auto result = set_mode_client_->async_send_request(request);
			if (rclcpp::spin_until_future_complete(this->shared_from_this(), result) !=
			    rclcpp::FutureReturnCode::SUCCESS) {
				throw std::runtime_error("Error calling set_mode service");
			}

			// wait for OFFBOARD mode
			while (rclcpp::ok()) {
				rclcpp::spin_some(this->shared_from_this());
				if (state_.mode == "OFFBOARD") {
					break;
				} else if (this->now() - start > offboard_timeout_) {
					string report = "OFFBOARD timed out";
					if (rclcpp::Time(statustext_.header.stamp) > start) {
						report += ": " + statustext_.text;
					}
					throw std::runtime_error(report);
				}
				rclcpp::spin_some(this->shared_from_this());
				r.sleep();
			}
		}

		if (!state_.armed) {
			rclcpp::Time start = this->now();
			RCLCPP_INFO(this->get_logger(), "arming");
			auto request = std::make_shared<mavros_msgs::srv::CommandBool::Request>();
			request->value = true;

			if (!arming_client_->wait_for_service(std::chrono::seconds(1))) {
				throw std::runtime_error("arming service not available");
			}

			auto result = arming_client_->async_send_request(request);
			if (rclcpp::spin_until_future_complete(this->shared_from_this(), result) !=
			    rclcpp::FutureReturnCode::SUCCESS) {
				throw std::runtime_error("Error calling arming service");
			}

			// wait until armed
			while (rclcpp::ok()) {
				rclcpp::spin_some(this->shared_from_this());
				if (state_.armed) {
					break;
				} else if (this->now() - start > arming_timeout_) {
					string report = "Arming timed out";
					if (rclcpp::Time(statustext_.header.stamp) > start) {
						report += ": " + statustext_.text;
					}
					throw std::runtime_error(report);
				}
				rclcpp::spin_some(this->shared_from_this());
				r.sleep();
			}
		}
	}

	inline double hypot(double x, double y, double z)
	{
		return std::sqrt(x * x + y * y + z * z);
	}

	inline float getDistance(const Point& from, const Point& to)
	{
		return hypot(from.x - to.x, from.y - to.y, from.z - to.z);
	}

	void getNavigateSetpoint(const rclcpp::Time& stamp, const float speed, Point& nav_setpoint)
	{
		if (wait_armed_) {
			// don't start navigating if we're waiting arming
			nav_start_.header.stamp = stamp;
		}

		float distance = getDistance(nav_start_.pose.position, setpoint_pose_local_.pose.position);
		float time = distance / speed;
		double elapsed = (stamp - nav_start_.header.stamp).seconds();
		float passed = std::min(static_cast<float>(elapsed / time), 1.0f);

		nav_setpoint.x = nav_start_.pose.position.x + (setpoint_pose_local_.pose.position.x - nav_start_.pose.position.x) * passed;
		nav_setpoint.y = nav_start_.pose.position.y + (setpoint_pose_local_.pose.position.y - nav_start_.pose.position.y) * passed;
		nav_setpoint.z = nav_start_.pose.position.z + (setpoint_pose_local_.pose.position.z - nav_start_.pose.position.z) * passed;
	}

	PoseStamped globalToLocal(double lat, double lon)
	{
		auto earth = GeographicLib::Geodesic::WGS84();

		// Determine azimuth and distance between current and destination point
		double _, distance, azimuth;
		earth.Inverse(global_position_.latitude, global_position_.longitude, lat, lon, distance, _, azimuth);

		double x_offset, y_offset;
		double azimuth_radians = azimuth * M_PI / 180;
		x_offset = distance * sin(azimuth_radians);
		y_offset = distance * cos(azimuth_radians);

		if (!waitTransform(local_frame_, fcu_frame_, rclcpp::Time(global_position_.header.stamp), rclcpp::Duration::from_seconds(0.2))) {
			throw std::runtime_error("No local position");
		}

		auto local = tf_buffer_->lookupTransform(local_frame_, fcu_frame_, rclcpp::Time(global_position_.header.stamp));

		PoseStamped pose;
		pose.header.stamp = global_position_.header.stamp; // TODO: ?
		pose.header.frame_id = local_frame_;
		pose.pose.position.x = local.transform.translation.x + x_offset;
		pose.pose.position.y = local.transform.translation.y + y_offset;
		pose.pose.orientation.w = 1.0;
		return pose;
	}

	// publish navigate_target frame
	void publishTarget(rclcpp::Time stamp, bool _static = false)
	{
		bool single_frame = (setpoint_position_.header.frame_id == setpoint_altitude_.header.frame_id);

		// handle yaw for target frame
		if (setpoint_yaw_type_ == YAW || setpoint_yaw_type_ == YAW_RATE) { // use last set yaw for yaw_rate
			if (setpoint_altitude_.header.frame_id == yaw_frame_id_) {
				tf2::Quaternion q;
				q.setRPY(0, 0, setpoint_yaw_);
				target_.transform.rotation = tf2::toMsg(q);
			} else {
				single_frame = false;
				tf2::Quaternion q;
				q.setRPY(0, 0, yaw_local_);
				target_.transform.rotation = tf2::toMsg(q);
			}
		} else if (setpoint_yaw_type_ == TOWARDS) {
			single_frame = false;
			tf2::Quaternion q;
			q.setRPY(0, 0, yaw_local_);
			target_.transform.rotation = tf2::toMsg(q);
		}

		if (_static && single_frame) {
			// publish at user's command, if all frames are the same
			target_.header.frame_id = setpoint_position_.header.frame_id;
			target_.header.stamp = stamp;
			target_.transform.translation.x = setpoint_position_.point.x;
			target_.transform.translation.y = setpoint_position_.point.y;
			target_.transform.translation.z = setpoint_position_.point.z;

		} else if (!_static) {
			// publish at each iteration, if frames are different
			target_.header = setpoint_pose_local_.header;
			target_.transform.translation.x = setpoint_pose_local_.pose.position.x;
			target_.transform.translation.y = setpoint_pose_local_.pose.position.y;
			target_.transform.translation.z = setpoint_pose_local_.pose.position.z;
		}

		static_transform_broadcaster_->sendTransform(target_);
	}

	void publish(const rclcpp::Time stamp)
	{
		if (setpoint_type_ == NONE) return;

		position_raw_msg_.header.stamp = stamp;

		// transform position
		if (setpoint_type_ == NAVIGATE || setpoint_type_ == NAVIGATE_GLOBAL || setpoint_type_ == POSITION) {
			setpoint_position_.header.stamp = stamp;
			setpoint_altitude_.header.stamp = stamp;
			// transform xy
			try {
				auto xy = tf_buffer_->transform(setpoint_position_, local_frame_, transform_timeout_);
				setpoint_pose_local_.header = xy.header;
				setpoint_pose_local_.pose.position.x = xy.point.x;
				setpoint_pose_local_.pose.position.y = xy.point.y;
			} catch (tf2::TransformException& ex) {
				// can't transform xy, use last known
				RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 10000, "can't transform: %s", ex.what());
			}
			// transform altitude
			try {
				auto alt = tf_buffer_->transform(setpoint_altitude_, local_frame_, transform_timeout_);
				setpoint_pose_local_.pose.position.z = alt.point.z;
			} catch (tf2::TransformException& ex) {
				// can't transform altitude, use last known
				RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 10000, "can't transform: %s", ex.what());
			}
		}

		// transform yaw
		if (setpoint_yaw_type_ == YAW) {
			try {
				QuaternionStamped q;
				q.header.stamp = stamp;
				q.header.frame_id = yaw_frame_id_;
				tf2::Quaternion q_tf;
				q_tf.setRPY(0, 0, setpoint_yaw_);
				q.quaternion = tf2::toMsg(q_tf);
				auto q_transformed = tf_buffer_->transform(q, local_frame_, transform_timeout_);
				yaw_local_ = tf2::getYaw(q_transformed.quaternion);
			} catch (tf2::TransformException& ex) {
				// can't transform yaw, use last known
				RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 10000, "can't transform: %s", ex.what());
			}
		}

		// compute navigate setpoint
		if (setpoint_type_ == NAVIGATE || setpoint_type_ == NAVIGATE_GLOBAL) {
			getNavigateSetpoint(stamp, nav_speed_, position_msg_.pose.position);

			if (setpoint_yaw_type_ == TOWARDS) {
				yaw_local_ = atan2(position_msg_.pose.position.y - nav_start_.pose.position.y,
				                  position_msg_.pose.position.x - nav_start_.pose.position.x);
			}

			tf2::Quaternion q;
			q.setRPY(0, 0, yaw_local_);
			position_msg_.pose.orientation = tf2::toMsg(q);
		}

		if (setpoint_type_ == POSITION) {
			position_msg_ = setpoint_pose_local_;
			tf2::Quaternion q;
			q.setRPY(0, 0, yaw_local_);
			position_msg_.pose.orientation = tf2::toMsg(q);
		}

		if (setpoint_type_ == POSITION || setpoint_type_ == NAVIGATE || setpoint_type_ == NAVIGATE_GLOBAL) {
			position_msg_.header.stamp = stamp;

			if (setpoint_yaw_type_ == YAW || setpoint_yaw_type_ == TOWARDS) {
				position_pub_->publish(position_msg_);

			} else {
				position_raw_msg_.type_mask = PositionTarget::IGNORE_VX +
				                             PositionTarget::IGNORE_VY +
				                             PositionTarget::IGNORE_VZ +
				                             PositionTarget::IGNORE_AFX +
				                             PositionTarget::IGNORE_AFY +
				                             PositionTarget::IGNORE_AFZ +
				                             PositionTarget::IGNORE_YAW;
				position_raw_msg_.yaw_rate = setpoint_rates_.z;
				position_raw_msg_.position = position_msg_.pose.position;
				position_raw_pub_->publish(position_raw_msg_);
			}

			// publish setpoint frame
			if (!setpoint_.child_frame_id.empty()) {
				if (rclcpp::Time(setpoint_.header.stamp) >= rclcpp::Time(position_msg_.header.stamp)) {
					return; // avoid TF_REPEATED_DATA warnings
				}

				setpoint_.transform.translation.x = position_msg_.pose.position.x;
				setpoint_.transform.translation.y = position_msg_.pose.position.y;
				setpoint_.transform.translation.z = position_msg_.pose.position.z;
				setpoint_.transform.rotation = position_msg_.pose.orientation;
				setpoint_.header.frame_id = position_msg_.header.frame_id;
				setpoint_.header.stamp = position_msg_.header.stamp;
				transform_broadcaster_->sendTransform(setpoint_);
			}

			// publish dynamic target frame
			publishTarget(stamp);
		}

		if (setpoint_type_ == VELOCITY) {
			// transform velocity to local frame
			setpoint_velocity_.header.stamp = stamp;
			try {
				setpoint_velocity_local_ = tf_buffer_->transform(setpoint_velocity_, local_frame_, transform_timeout_);
			} catch (tf2::TransformException& ex) {
				// can't transform velocity, use last known
				RCLCPP_WARN_THROTTLE(this->get_logger(), *this->get_clock(), 10000, "can't transform: %s", ex.what());
			}

			// publish velocity
			position_raw_msg_.type_mask = PositionTarget::IGNORE_PX +
			                             PositionTarget::IGNORE_PY +
			                             PositionTarget::IGNORE_PZ +
			                             PositionTarget::IGNORE_AFX +
			                             PositionTarget::IGNORE_AFY +
			                             PositionTarget::IGNORE_AFZ;
			position_raw_msg_.type_mask += setpoint_yaw_type_ == YAW ? PositionTarget::IGNORE_YAW_RATE : PositionTarget::IGNORE_YAW;
			position_raw_msg_.velocity = setpoint_velocity_local_.vector;
			position_raw_msg_.yaw = yaw_local_;
			position_raw_msg_.yaw_rate = setpoint_rates_.z;
			position_raw_pub_->publish(position_raw_msg_);
		}

		if (setpoint_type_ == ATTITUDE) {
			PoseStamped msg;
			msg.header.stamp = stamp;
			msg.header.frame_id = local_frame_;
			tf2::Quaternion q;
			q.setRPY(setpoint_roll_, setpoint_pitch_, yaw_local_);
			msg.pose.orientation = tf2::toMsg(q);
			attitude_pub_->publish(msg);

			Thrust thrust_msg;
			thrust_msg.header.stamp = stamp;
			thrust_msg.thrust = setpoint_thrust_;
			thrust_pub_->publish(thrust_msg);
		}

		if (setpoint_type_ == RATES) {
			// mavros rates topics waits for rates in local frame
			// use rates in body frame for simplicity
			AttitudeTarget att_raw_msg;
			att_raw_msg.header.stamp = stamp;
			att_raw_msg.header.frame_id = fcu_frame_;
			att_raw_msg.type_mask = AttitudeTarget::IGNORE_ATTITUDE;
			att_raw_msg.body_rate = setpoint_rates_;
			att_raw_msg.thrust = setpoint_thrust_;
			attitude_raw_pub_->publish(att_raw_msg);
		}
	}

	void publishSetpoint()
	{
		publish(this->now());
	}

	inline void checkManualControl()
	{
		if (manual_control_timeout_.seconds() > 0 && TIMEOUT(manual_control_, manual_control_timeout_)) {
			throw std::runtime_error("Manual control timeout, RC is switched off?");
		}

		if (check_kill_switch_) {
			// switch values: https://github.com/PX4/PX4-Autopilot/blob/c302514a0809b1765fafd13c014d705446ae1113/msg/manual_control_setpoint.msg#L3
			const uint8_t SWITCH_POS_NONE = 0; // switch is not mapped
			const uint8_t SWITCH_POS_ON = 1; // switch activated
			const uint8_t SWITCH_POS_MIDDLE = 2; // middle position
			const uint8_t SWITCH_POS_OFF = 3; // switch not activated

			const int KILL_SWITCH_BIT = 12; // https://github.com/PX4/Firmware/blob/c302514a0809b1765fafd13c014d705446ae1113/src/modules/mavlink/mavlink_messages.cpp#L3975
			uint8_t kill_switch = (manual_control_.buttons & (0b11 << KILL_SWITCH_BIT)) >> KILL_SWITCH_BIT;

			if (kill_switch == SWITCH_POS_ON)
				throw std::runtime_error("Kill switch is on");
		}
	}

	inline void checkState()
	{
		if (TIMEOUT(state_, state_timeout_))
			throw std::runtime_error("State timeout, check mavros settings");

		if (!state_.connected)
			throw std::runtime_error("No connection to FCU, https://clover.coex.tech/connection");
	}

	void publishState()
	{
		clover::msg::State msg;
		msg.mode = setpoint_type_;
		msg.yaw_mode = setpoint_yaw_type_;

		if (setpoint_position_.header.frame_id.empty()) {
			msg.x = NAN;
			msg.y = NAN;
			msg.z = NAN;
		} else {
			msg.x = setpoint_position_.point.x;
			msg.y = setpoint_position_.point.y;
			msg.z = setpoint_altitude_.point.z;
		}

		msg.speed = nav_speed_;
		msg.lat = setpoint_lat_;
		msg.lon = setpoint_lon_;
		msg.vx = setpoint_velocity_.vector.x;
		msg.vy = setpoint_velocity_.vector.y;
		msg.vz = setpoint_velocity_.vector.z;
		msg.roll = setpoint_roll_;
		msg.pitch = setpoint_pitch_;
		msg.yaw = !yaw_frame_id_.empty() ? setpoint_yaw_ : NAN;

		msg.roll_rate = setpoint_rates_.x;
		msg.pitch_rate = setpoint_rates_.y;
		msg.yaw_rate = setpoint_rates_.z;
		msg.thrust = setpoint_thrust_;

		if (setpoint_type_ == VELOCITY) {
			msg.xy_frame_id = setpoint_velocity_.header.frame_id;
			msg.z_frame_id = setpoint_velocity_.header.frame_id;
		} else {
			msg.xy_frame_id = setpoint_position_.header.frame_id;
			msg.z_frame_id = setpoint_altitude_.header.frame_id;
		}
		msg.yaw_frame_id = yaw_frame_id_;

		state_pub_->publish(msg);
	}

	inline float safe(float value) {
		return std::isfinite(value) ? value : 0;
	}

	#define ENSURE_FINITE(var) { if (!std::isfinite(var)) throw std::runtime_error(#var " argument cannot be NaN or Inf"); }

	#define ENSURE_NON_INF(var) { if (std::isinf(var)) throw std::runtime_error(#var " argument cannot be Inf"); }

	bool serve(enum setpoint_type_t sp_type, float x, float y, float z, float vx, float vy, float vz,
	           float roll, float pitch, float yaw, float roll_rate, float pitch_rate, float yaw_rate,
	           float lat, float lon, float thrust, float speed, string frame_id, bool auto_arm,
	           uint8_t& success, string& message)
	{
		auto stamp = this->now();

		try {
			if (busy_)
				throw std::runtime_error("Busy");

			busy_ = true;

			// Checks
			checkState();

			if (auto_arm) {
				checkManualControl();
			}

			// default frame is local frame
			if (frame_id.empty())
				frame_id = local_frame_;

			// look up for reference frame
			auto search = reference_frames_.find(frame_id);
			const string& reference_frame = search == reference_frames_.end() ? frame_id : search->second;

			ENSURE_NON_INF(x);
			ENSURE_NON_INF(y);
			ENSURE_NON_INF(z);
			ENSURE_NON_INF(speed); // TODO: allow inf
			ENSURE_NON_INF(vx);
			ENSURE_NON_INF(vy);
			ENSURE_NON_INF(vz);
			ENSURE_NON_INF(roll);
			ENSURE_NON_INF(pitch);
			ENSURE_NON_INF(roll_rate);
			ENSURE_NON_INF(pitch_rate);
			ENSURE_NON_INF(yaw_rate);
			ENSURE_NON_INF(thrust);

			if (sp_type == NAVIGATE_GLOBAL) {
				ENSURE_FINITE(lat);
				ENSURE_FINITE(lon);
			}

			if (isfinite(x) != isfinite(y)) {
				throw std::runtime_error("x and y can be set only together");
			}

			if (isfinite(yaw_rate)) {
				if (sp_type > RATES && setpoint_type_ == ATTITUDE) {
					throw std::runtime_error("Yaw rate cannot be set in attitude mode.");
				}
			}

			// set_altitude
			if (sp_type == _ALTITUDE) {
				if (setpoint_type_ == VELOCITY || setpoint_type_ == ATTITUDE || setpoint_type_ == RATES) {
					throw std::runtime_error("Altitude cannot be set in velocity, attitude or rates mode.");
				}
			}

			if (sp_type == NAVIGATE || sp_type == NAVIGATE_GLOBAL) {
				if (TIMEOUT(local_position_, local_position_timeout_))
					throw std::runtime_error("No local position, check settings");

				if (speed < 0)
					throw std::runtime_error("Navigate speed must be positive, " + std::to_string(speed) + " passed");

				if (speed == 0)
					speed = default_speed_;
			}

			if (sp_type == NAVIGATE_GLOBAL) {
				if (TIMEOUT(global_position_, global_position_timeout_))
					throw std::runtime_error("No global position");
			}

			// if any value need to be transformed to reference frame
			if (isfinite(x) || isfinite(y) || isfinite(z) || isfinite(vx) || isfinite(vy) || isfinite(vz) || isfinite(yaw)) {
				// make sure transform from frame_id to reference frame available
				if (!waitTransform(reference_frame, frame_id, stamp, transform_timeout_))
					throw std::runtime_error("Can't transform from " + frame_id + " to " + reference_frame);

				// make sure transform from reference frame to local frame available
				if (!waitTransform(local_frame_, reference_frame, stamp, transform_timeout_))
					throw std::runtime_error("Can't transform from " + reference_frame + " to " + local_frame_);
			}

			if (sp_type == NAVIGATE_GLOBAL) {
				// Calculate x and from lat and lot in request's frame
				auto pose_local = globalToLocal(lat, lon);
				pose_local.header.stamp = stamp; // TODO: fix
				auto xy_in_req_frame = tf_buffer_->transform(pose_local, frame_id, transform_timeout_);
				x = xy_in_req_frame.pose.position.x;
				y = xy_in_req_frame.pose.position.y;
				setpoint_lat_ = lat;
				setpoint_lon_ = lon;
			}

			// Everything fine - switch setpoint type
			if (sp_type <= RATES) {
				setpoint_type_ = sp_type;
			}

			if (setpoint_type_ != NAVIGATE && setpoint_type_ != NAVIGATE_GLOBAL) {
				nav_from_sp_flag_ = false;
			}

			bool to_auto_arm = auto_arm && (state_.mode != "OFFBOARD" || !state_.armed);
			if (to_auto_arm || setpoint_type_ == VELOCITY || setpoint_type_ == ATTITUDE || setpoint_type_ == RATES) {
				// invalidate position setpoint
				setpoint_position_.header.frame_id = "";
				setpoint_altitude_.header.frame_id = "";
				yaw_frame_id_ = "";
			}

			if (sp_type == NAVIGATE || sp_type == NAVIGATE_GLOBAL) {
				// starting point
				if (nav_from_sp_ && nav_from_sp_flag_) {
					message = "Navigating from current setpoint";
					nav_start_ = position_msg_;
				} else {
					nav_start_ = local_position_;
				}

				if (!isnan(speed)) {
					nav_speed_ = speed;
				}

				nav_from_sp_flag_ = true;
			}

			// handle position
			if (setpoint_type_ == NAVIGATE || setpoint_type_ == NAVIGATE_GLOBAL || setpoint_type_ == POSITION) {

				PointStamped desired;
				desired.header.frame_id = frame_id;
				desired.header.stamp = stamp;
				desired.point.x = safe(x);
				desired.point.y = safe(y);
				desired.point.z = safe(z);

				// transform to reference frame
				desired = tf_buffer_->transform(desired, reference_frame, transform_timeout_);

				// set horizontal position
				if (isfinite(x) && isfinite(y)) {
					setpoint_position_ = desired;
				} else if (setpoint_position_.header.frame_id.empty()) {
					 // TODO: use transform for current stamp
					setpoint_position_.header = local_position_.header;
					setpoint_position_.point = local_position_.pose.position;
				}

				// set altitude
				if (isfinite(z)) {
					setpoint_altitude_ = desired;
				} else if (setpoint_altitude_.header.frame_id.empty()) {
					setpoint_altitude_.header = local_position_.header;
					setpoint_altitude_.point = local_position_.pose.position;
				}
			}

			// handle velocity
			if (sp_type == VELOCITY) {
				// TODO: allow setting different modes by altitude and xy
				Vector3Stamped desired;
				desired.header.frame_id = frame_id;
				desired.header.stamp = stamp;
				desired.vector.x = safe(vx);
				desired.vector.y = safe(vy);
				desired.vector.z = safe(vz);

				// transform to reference frame
				desired = tf_buffer_->transform(desired, reference_frame, transform_timeout_);
				setpoint_velocity_.header = desired.header;

				// set horizontal velocity
				if (isfinite(vx) && isfinite(vy)) {
					setpoint_velocity_.vector.x = desired.vector.x;
					setpoint_velocity_.vector.y = desired.vector.y;
				}

				// set vertical velocity
				if (isfinite(vz)) {
					setpoint_velocity_.vector.z = desired.vector.z;
				}
			}

			// handle yaw
			if (sp_type == NAVIGATE || sp_type == NAVIGATE_GLOBAL || sp_type == POSITION || sp_type == VELOCITY || sp_type == ATTITUDE || sp_type == _YAW) {
				if (isfinite(yaw)) {
					setpoint_yaw_type_ = YAW;
					QuaternionStamped desired;
					desired.header.frame_id = frame_id;
					desired.header.stamp = stamp;
					tf2::Quaternion q;
					q.setRPY(0, 0, yaw);
					desired.quaternion = tf2::toMsg(q);

					// transform to reference frame
					desired = tf_buffer_->transform(desired, reference_frame, transform_timeout_);
					setpoint_yaw_ = tf2::getYaw(desired.quaternion);
					yaw_frame_id_ = reference_frame;

				} else if (isinf(yaw) && yaw > 0) {
					// yaw towards
					setpoint_yaw_type_ = TOWARDS;

				} else if (yaw_frame_id_.empty() || sp_type == _YAW) {
					// yaw is nan and not set previously OR set_yaw(yaw=nan) was called
					setpoint_yaw_type_ = YAW;
					setpoint_yaw_ = tf2::getYaw(local_position_.pose.orientation); // set yaw to current yaw
					yaw_frame_id_ = local_position_.header.frame_id;
				}
			}

			// handle roll
			if (isfinite(roll)) {
				setpoint_roll_ = roll;
			}

			// handle pitch
			if (isfinite(pitch)) {
				setpoint_pitch_ = pitch;
			}

			// handle yaw rate
			if (isfinite(yaw_rate)) {
				setpoint_yaw_type_ = YAW_RATE;
				setpoint_rates_.z = yaw_rate;
			}

			// handle pitch rate
			if (isfinite(roll_rate)) {
				setpoint_rates_.x = roll_rate;
			}

			// handle roll rate
			if (isfinite(pitch_rate)) {
				setpoint_rates_.y = pitch_rate;
			}

			// handle thrust
			if (isfinite(thrust)) {
				setpoint_thrust_ = thrust;
			}

			wait_armed_ = auto_arm;

			publish(stamp); // calculate initial transformed messages first
			setpoint_timer_->reset();

			if (setpoint_type_ == NAVIGATE || setpoint_type_ == NAVIGATE_GLOBAL || setpoint_type_ == POSITION) {
				publishTarget(stamp, true);
			}

			publishState();

			if (auto_arm) {
				offboardAndArm();
				wait_armed_ = false;
			} else if (state_.mode != "OFFBOARD") {
				setpoint_timer_->cancel();
				throw std::runtime_error("Copter is not in OFFBOARD mode, use auto_arm?");
			} else if (!state_.armed) {
				setpoint_timer_->cancel();
				throw std::runtime_error("Copter is not armed, use auto_arm?");
			}

		} catch (const std::exception& e) {
			message = e.what();
			RCLCPP_INFO(this->get_logger(), "%s", message.c_str());
			busy_ = false;
			return true;
		}

		success = true;
		busy_ = false;
		return true;
	}

	void navigate(
		const std::shared_ptr<clover::srv::Navigate::Request> req,
		std::shared_ptr<clover::srv::Navigate::Response> res)
	{
		uint8_t success = 0;
		serve(NAVIGATE, req->x, req->y, req->z, NAN, NAN, NAN, NAN, NAN, req->yaw, NAN, NAN, NAN, NAN, NAN, NAN, req->speed, req->frame_id, req->auto_arm, success, res->message);
		res->success = success;
	}

	void navigateGlobal(
		const std::shared_ptr<clover::srv::NavigateGlobal::Request> req,
		std::shared_ptr<clover::srv::NavigateGlobal::Response> res)
	{
		uint8_t success = 0;
		serve(NAVIGATE_GLOBAL, NAN, NAN, req->z, NAN, NAN, NAN, NAN, NAN, req->yaw, NAN, NAN, NAN, req->lat, req->lon, NAN, req->speed, req->frame_id, req->auto_arm, success, res->message);
		res->success = success;
	}

	void setAltitude(
		const std::shared_ptr<clover::srv::SetAltitude::Request> req,
		std::shared_ptr<clover::srv::SetAltitude::Response> res)
	{
		uint8_t success = 0;
		serve(_ALTITUDE, NAN, NAN, req->z, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->frame_id, false, success, res->message);
		res->success = success;
	}

	void setYaw(
		const std::shared_ptr<clover::srv::SetYaw::Request> req,
		std::shared_ptr<clover::srv::SetYaw::Response> res)
	{
		uint8_t success = 0;
		serve(_YAW, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->yaw, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->frame_id, false, success, res->message);
		res->success = success;
	}

	void setYawRate(
		const std::shared_ptr<clover::srv::SetYawRate::Request> req,
		std::shared_ptr<clover::srv::SetYawRate::Response> res)
	{
		uint8_t success = 0;
		serve(_YAW_RATE, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->yaw_rate, NAN, NAN, NAN, NAN, "", false, success, res->message);
		res->success = success;
	}

	void setPosition(
		const std::shared_ptr<clover::srv::SetPosition::Request> req,
		std::shared_ptr<clover::srv::SetPosition::Response> res)
	{
		uint8_t success = 0;
		serve(POSITION, req->x, req->y, req->z, NAN, NAN, NAN, NAN, NAN, req->yaw, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->frame_id, req->auto_arm, success, res->message);
		res->success = success;
	}

	void setVelocity(
		const std::shared_ptr<clover::srv::SetVelocity::Request> req,
		std::shared_ptr<clover::srv::SetVelocity::Response> res)
	{
		uint8_t success = 0;
		serve(VELOCITY, NAN, NAN, NAN, req->vx, req->vy, req->vz, NAN, NAN, req->yaw, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->frame_id, req->auto_arm, success, res->message);
		res->success = success;
	}

	void setAttitude(
		const std::shared_ptr<clover::srv::SetAttitude::Request> req,
		std::shared_ptr<clover::srv::SetAttitude::Response> res)
	{
		uint8_t success = 0;
		serve(ATTITUDE, NAN, NAN, NAN, NAN, NAN, NAN, req->roll, req->pitch, req->yaw, NAN, NAN, NAN, NAN, NAN, req->thrust, NAN, req->frame_id, req->auto_arm, success, res->message);
		res->success = success;
	}

	void setRates(
		const std::shared_ptr<clover::srv::SetRates::Request> req,
		std::shared_ptr<clover::srv::SetRates::Response> res)
	{
		uint8_t success = 0;
		serve(RATES, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, NAN, req->roll_rate, req->pitch_rate, req->yaw_rate, NAN, NAN, req->thrust, NAN, "", req->auto_arm, success, res->message);
		res->success = success;
	}

	void land(
		const std::shared_ptr<std_srvs::srv::Trigger::Request> req,
		std::shared_ptr<std_srvs::srv::Trigger::Response> res)
	{
		try {
			if (busy_)
				throw std::runtime_error("Busy");

			busy_ = true;

			checkState();

			if (land_only_in_offboard_) {
				if (state_.mode != "OFFBOARD") {
					throw std::runtime_error("Copter is not in OFFBOARD mode");
				}
			}

			auto request = std::make_shared<mavros_msgs::srv::SetMode::Request>();
			request->custom_mode = "AUTO.LAND";

			if (!set_mode_client_->wait_for_service(std::chrono::seconds(1))) {
				throw std::runtime_error("set_mode service not available");
			}

			auto result = set_mode_client_->async_send_request(request);
			if (rclcpp::spin_until_future_complete(this->shared_from_this(), result) !=
			    rclcpp::FutureReturnCode::SUCCESS) {
				throw std::runtime_error("Can't call set_mode service");
			}

			if (!result.get()->mode_sent) {
				throw std::runtime_error("Can't send set_mode request");
			}

			rclcpp::Rate r(10, this->get_clock());
			auto start = this->now();
			while (rclcpp::ok()) {
				if (state_.mode == "AUTO.LAND") {
					break;
				}
				if (this->now() - start > land_timeout_)
					throw std::runtime_error("Land request timed out");

				rclcpp::spin_some(this->shared_from_this());
				r.sleep();
			}

			// stop setpoints and invalidate position setpoint
			setpoint_timer_->cancel();
			setpoint_type_ = NONE;
			setpoint_position_.header.frame_id = "";
			setpoint_altitude_.header.frame_id = "";
			yaw_frame_id_ = "";
			publishState();

			res->success = true;
			busy_ = false;

		} catch (const std::exception& e) {
			res->message = e.what();
			RCLCPP_INFO(this->get_logger(), "%s", e.what());
			busy_ = false;
		}
	}

	void release(
		const std::shared_ptr<std_srvs::srv::Trigger::Request> req,
		std::shared_ptr<std_srvs::srv::Trigger::Response> res)
	{
		setpoint_timer_->cancel();
		setpoint_type_ = NONE;
		setpoint_position_.header.frame_id = "";
		setpoint_altitude_.header.frame_id = "";
		yaw_frame_id_ = "";
		publishState();
		res->success = true;
	}
};

int main(int argc, char **argv)
{
	rclcpp::init(argc, argv);
	rclcpp::spin(std::make_shared<SimpleOffboard>());
	rclcpp::shutdown();
	return 0;
}
