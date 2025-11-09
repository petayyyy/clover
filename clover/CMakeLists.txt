cmake_minimum_required(VERSION 3.8)
project(clover)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Set C++ standard to C++17 for Ubuntu 22.04
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

## Find ament packages
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclpy REQUIRED)
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(tf2 REQUIRED)
find_package(tf2_geometry_msgs REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(std_srvs REQUIRED)
find_package(mavros_msgs REQUIRED)

# GeographicLib
set(CMAKE_MODULE_PATH "${CMAKE_MODULE_PATH};/usr/share/cmake/geographiclib")
find_package(GeographicLib REQUIRED)



################################################
## Declare ROS messages, services and actions ##
################################################

rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/State.msg"
  "srv/GetTelemetry.srv"
  "srv/Navigate.srv"
  "srv/NavigateGlobal.srv"
  "srv/SetAltitude.srv"
  "srv/SetYaw.srv"
  "srv/SetYawRate.srv"
  "srv/SetPosition.srv"
  "srv/SetVelocity.srv"
  "srv/SetAttitude.srv"
  "srv/SetRates.srv"
  "srv/SetLEDEffect.srv"
  "srv/Execute.srv"
  DEPENDENCIES std_msgs
)

###########
## Build ##
###########

## Declare a C++ executable for simple_offboard
add_executable(simple_offboard src/simple_offboard.cpp)

ament_target_dependencies(simple_offboard
  rclcpp
  std_msgs
  geometry_msgs
  sensor_msgs
  tf2
  tf2_geometry_msgs
  tf2_ros
  std_srvs
  mavros_msgs
)

target_link_libraries(simple_offboard
  ${GeographicLib_LIBRARIES}
)

target_include_directories(simple_offboard PUBLIC
  ${GeographicLib_INCLUDE_DIRS}
)

rosidl_target_interfaces(simple_offboard
  ${PROJECT_NAME} "rosidl_typesupport_cpp")


## Declare a C++ executable for vpe_publisher
add_executable(vpe_publisher src/vpe_publisher.cpp)

ament_target_dependencies(vpe_publisher
  rclcpp
  std_msgs
  geometry_msgs
  tf2
  tf2_geometry_msgs
  tf2_ros
  std_srvs
)

rosidl_target_interfaces(vpe_publisher
  ${PROJECT_NAME} "rosidl_typesupport_cpp")


#############
## Install ##
#############

install(TARGETS simple_offboard vpe_publisher
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY launch
  DESTINATION share/${PROJECT_NAME}
)

install(DIRECTORY examples
  DESTINATION share/${PROJECT_NAME}
)

install(DIRECTORY www
  DESTINATION share/${PROJECT_NAME}
)

# Only install udev rules when building a Debian package
string(FIND ${CMAKE_INSTALL_PREFIX} "/opt/ros" _PREFIX_INDEX)
if (${_PREFIX_INDEX} EQUAL 0)
  message(STATUS "Building as a Debian package - adding udev rules as installable files")
  install(FILES
    udev/99-px4fmu.rules
    DESTINATION /lib/udev/rules.d
  )
else()
  message(STATUS "Building in a user workspace - not adding udev rules")
endif()

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
