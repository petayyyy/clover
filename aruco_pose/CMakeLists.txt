cmake_minimum_required(VERSION 3.8)
project(aruco_pose)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# C++17 for ROS2 Humble
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_components REQUIRED)
find_package(tf2 REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(tf2_geometry_msgs REQUIRED)
find_package(cv_bridge REQUIRED)
find_package(image_transport REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(visualization_msgs REQUIRED)
find_package(std_msgs REQUIRED)
find_package(message_filters REQUIRED)
find_package(rosidl_default_generators REQUIRED)

# OpenCV 4 for Ubuntu 22.04
set(_opencv_version 4)
find_package(OpenCV ${_opencv_version} QUIET COMPONENTS core imgproc calib3d)
if (NOT OpenCV_FOUND)
  message(STATUS "Did not find OpenCV 4, searching for OpenCV 3")
  set(_opencv_version 3)
endif()

find_package(OpenCV ${_opencv_version} REQUIRED COMPONENTS core imgproc calib3d)
if ("${OpenCV_VERSION_MINOR}" LESS "9")
  message(STATUS "OpenCV version too low, using vendored ArUco package")
  include(vendor/VendorOpenCV.cmake)
else()
  message(STATUS "Using system OpenCV ArUco package")
  find_package(OpenCV ${_opencv_version} REQUIRED COMPONENTS aruco)
endif()
message(STATUS "OpenCV include dirs: ${OpenCV_INCLUDE_DIRS}")
message(STATUS "OpenCV libraries: ${OpenCV_LIBRARIES}")

# Generate messages
rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/Point2D.msg"
  "msg/Marker.msg"
  "msg/MarkerArray.msg"
  "srv/SetMarkers.srv"
  DEPENDENCIES std_msgs geometry_msgs
)

# Include directories
include_directories(
  include
  ${OpenCV_INCLUDE_DIRS}
)

# Library
add_library(aruco_pose
  src/aruco_detect.cpp
  src/aruco_map.cpp
  src/draw.cpp
)

ament_target_dependencies(aruco_pose
  rclcpp
  rclcpp_components
  tf2
  tf2_ros
  tf2_geometry_msgs
  cv_bridge
  image_transport
  sensor_msgs
  geometry_msgs
  visualization_msgs
  std_msgs
  message_filters
)

target_link_libraries(aruco_pose
  ${OpenCV_LIBRARIES}
)

# Prevent aruco_pose from having undefined symbols
set_property(TARGET aruco_pose
  APPEND
  PROPERTY LINK_FLAGS
  -Wl,--no-undefined
)

# Register components
rclcpp_components_register_nodes(aruco_pose
  "ArucoDetect"
  "ArucoMap"
)

# Install
install(TARGETS
  aruco_pose
  EXPORT export_${PROJECT_NAME}
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)

install(DIRECTORY launch
  DESTINATION share/${PROJECT_NAME}/
)

install(DIRECTORY map
  DESTINATION share/${PROJECT_NAME}/
)

install(PROGRAMS src/genmap.py
  DESTINATION lib/${PROJECT_NAME}
)

# Install components
install(TARGETS
  aruco_pose
  EXPORT export_${PROJECT_NAME}
  COMPONENT aruco_pose_components
)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

ament_export_include_directories(include)
ament_export_libraries(aruco_pose)
ament_export_dependencies(
  rclcpp
  rclcpp_components
  tf2
  tf2_ros
  tf2_geometry_msgs
  cv_bridge
  image_transport
  sensor_msgs
  geometry_msgs
  visualization_msgs
  std_msgs
  message_filters
)

ament_package()
