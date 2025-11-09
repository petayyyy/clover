# Positioning with ArUco markers

[Русская версия документации](README_RU.md) | [English documentation](README.md)

`aruco_pose` package consists of two ROS2 components: `aruco_detect` detects individual ArUco-markers and estimates their poses, `aruco_map` detects maps of markers using `aruco_detect` output.

## Requirements

- **ROS2**: Humble Hawksbill
- **OS**: Ubuntu 22.04 (Jammy Jellyfish)
- **OpenCV**: 4.x (included in Ubuntu 22.04 repositories)
- **C++**: C++17 compiler

## Installation

### 1. Install ROS2 Humble

If you haven't installed ROS2 Humble yet, follow the [official installation guide](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html):

```bash
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -
sudo add-apt-repository "deb [arch=$(dpkg --print-architecture)] http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main"
sudo apt update
sudo apt install ros-humble-desktop -y
```

### 2. Install OpenCV 4

OpenCV 4 is available in Ubuntu 22.04 repositories. Install it with:

```bash
sudo apt update
sudo apt install libopencv-dev libopencv-contrib-dev
```

To verify OpenCV installation:

```bash
pkg-config --modversion opencv4
```

If you need to build OpenCV from source (for example, to enable additional features), follow these steps:

```bash
# Install build dependencies
sudo apt install build-essential cmake git pkg-config libgtk-3-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev \
    libxvidcore-dev libx264-dev libjpeg-dev libpng-dev libtiff-dev \
    gfortran openexr libatlas-base-dev python3-dev python3-numpy \
    libtbb2 libtbb-dev libdc1394-22-dev

# Clone OpenCV
cd ~
git clone https://github.com/opencv/opencv.git
git clone https://github.com/opencv/opencv_contrib.git
cd opencv
git checkout 4.8.0  # or latest 4.x version
cd ../opencv_contrib
git checkout 4.8.0

# Build OpenCV
cd ~/opencv
mkdir build && cd build
cmake -D CMAKE_BUILD_TYPE=RELEASE \
    -D CMAKE_INSTALL_PREFIX=/usr/local \
    -D INSTALL_PYTHON_EXAMPLES=ON \
    -D INSTALL_C_EXAMPLES=OFF \
    -D OPENCV_ENABLE_NONFREE=ON \
    -D CMAKE_SHARED_LINKER_FLAGS=-Wl,-rpath,/usr/local/lib \
    -D OPENCV_EXTRA_MODULES_PATH=~/opencv_contrib/modules \
    -D PYTHON_EXECUTABLE=/usr/bin/python3 \
    -D BUILD_EXAMPLES=ON \
    -D WITH_OPENGL=ON \
    -D WITH_QT=OFF \
    -D OPENCV_GENERATE_PKGCONFIG=ON ..

make -j$(nproc)
sudo make install
sudo ldconfig
```

### 3. Install ROS2 Dependencies

Install required ROS2 packages:

```bash
sudo apt install \
    ros-humble-rclcpp \
    ros-humble-rclcpp-components \
    ros-humble-tf2 \
    ros-humble-tf2-ros \
    ros-humble-tf2-geometry-msgs \
    ros-humble-cv-bridge \
    ros-humble-image-transport \
    ros-humble-sensor-msgs \
    ros-humble-geometry-msgs \
    ros-humble-visualization-msgs \
    ros-humble-std-msgs \
    ros-humble-message-filters \
    ros-humble-rcl-interfaces \
    python3-docopt
```

### 4. Build the Package

Create a ROS2 workspace (if you don't have one):

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
```

Clone or copy this package into the workspace:

```bash
# If using git:
git clone <repository-url> aruco_pose

# Or copy the package directory here
```

Install workspace dependencies:

```bash
cd ~/ros2_ws
rosdep update
rosdep install --from-paths src --ignore-src -r -y
```

Build the package:

```bash
cd ~/ros2_ws
colcon build --packages-select aruco_pose
```

Source the workspace:

```bash
source ~/ros2_ws/install/setup.bash
```

## Quick start

To run the camera node, markers and maps detector:

```bash
ros2 launch aruco_pose sample.launch.py
```

You're going to need a camera node (e.g., [`cv_camera`](https://github.com/ros-perception/image_pipeline) or similar ROS2 camera driver) running and publishing to `image_raw` and `camera_info` topics.

## aruco_detect node

`aruco_detect` detects ArUco markers on the image, publishes list of them (with poses), TF transformations, visualization markers and processed image for debugging.

It's recommended to run it as a component within the same component container with the camera node.

### Parameters

* `dictionary` (*int*) – ArUco dictionary (default: 2)
  * 0 = DICT_4X4_50
  * 1 = DICT_4X4_100,
  * 2 = DICT_4X4_250,
  * 3 = DICT_4X4_1000,
  * 4 = DICT_5X5_50,
  * 5 = DICT_5X5_100,
  * 6 = DICT_5X5_250,
  * 7 = DICT_5X5_1000,
  * 8 = DICT_6X6_50,
  * 9 = DICT_6X6_100,
  * 10 = DICT_6X6_250,
  * 11 = DICT_6X6_1000,
  * 12 = DICT_7X7_50,
  * 13 = DICT_7X7_100,
  * 14 = DICT_7X7_250,
  * 15 = DICT_7X7_1000,
  * 16 = DICT_ARUCO_ORIGINAL
* `estimate_poses` (*bool*) – estimate single markers' poses (default: true)
* `send_tf` (*bool*) – send TF transforms (default: true)
* `frame_id_prefix` (*string*) – prefix for TF transforms names, marker's ID is appended (default: `aruco_`)
* `length` (*double*) – markers' sides length (required if `estimate_poses` is true)
* `length_override.<id>` (*double*) – length override for specific marker ID (e.g., `length_override.3` = 0.1)
* `known_vertical` (*string*) – known vertical (Z axis) of all the markers as a frame
* `flip_vertical` (*bool*) – flip vertical vector (default: false)
* `auto_flip` (*bool*) – automatically flip vertical if needed (default: false)
* `enabled` (*bool*) – enable/disable detection (default: true)
* `transform_timeout` (*double*) – timeout for TF lookups in seconds (default: 0.02)

### Topics

#### Subscribed

* `image_raw` (*sensor_msgs/msg/Image*) – camera image
* `camera_info` (*sensor_msgs/msg/CameraInfo*) – camera calibration info
* `map_markers` (*aruco_pose/msg/MarkerArray*) – list of markers to disable TF transform publishing

#### Published

* `markers` (*aruco_pose/msg/MarkerArray*) – list of detected markers with their corners and poses
* `visualization` (*visualization_msgs/msg/MarkerArray*) – visualization markers for rviz2
* `debug` (*sensor_msgs/msg/Image*) – debug image with detected markers

### Services

* `set_length_override` (*aruco_pose/srv/SetMarkers*) – dynamically set marker length overrides

### Published transforms

* `<camera_frame>` => `<frame_id_prefix><id>` – markers' poses

## aruco_map node

`aruco_map` node estimates position of markers map.

### Parameters

* `map` (*string*) – path to text file with markers list
* `frame_id` (*string*) – published frame id (default: `aruco_map`)
* `known_vertical` (*string*) – known vertical (Z axis) of markers map as a frame
* `flip_vertical` (*bool*) – flip vertical vector (default: false)
* `auto_flip` (*bool*) – automatically flip vertical if needed (default: false)
* `image_width` (*int*) – debug image width (default: 2000)
* `image_height` (*int*) – debug image height (default: 2000)
* `image_margin` (*int*) – debug image margin (default: 200)
* `image_axis` (*bool*) – whether debug image should contain axis (default: true)
* `dictionary` (*int*) – ArUco dictionary (default: 2) - should be the same as `dictionary` parameter of `aruco_detect` node
* `type` (*string*) – map type: "map" or "gridboard" (default: "map")
* `enabled` (*bool*) – enable/disable map detection (default: true)
* `put_markers_count_to_covariance` (*bool*) – put valid markers count in covariance[0] (default: false)
* `markers.frame_id` (*string*) – parent frame for marker static transforms
* `markers.child_frame_id_prefix` (*string*) – prefix for marker static transform child frames

Map file has one marker per line with the following line format:

```
marker_id marker_length x y z yaw pitch roll
```

Where yaw, pitch and roll are extrinsic rotation around Z, Y, X axis, respectively.

See examples in [`map`](map/) directory.

### Topics

#### Subscribed

* `image_raw` (*sensor_msgs/msg/Image*) – camera image (used for debug image)
* `camera_info` (*sensor_msgs/msg/CameraInfo*) – camera calibration info (used for debug image)
* `markers` (*aruco_pose/msg/MarkerArray*) – list of markers detected by `aruco_detect` node

#### Published

* `pose` (*geometry_msgs/msg/PoseWithCovarianceStamped*) – estimated map pose
* `map` (*aruco_pose/msg/MarkerArray*) – list of markers in the loaded map
* `image` (*sensor_msgs/msg/Image*) – planarized map image
* `visualization` (*visualization_msgs/msg/MarkerArray*) – markers map visualization for rviz2
* `debug` (*sensor_msgs/msg/Image*) – debug image with detected markers and map axis

### Published transforms

* `<camera_frame>` => `<map_name>` – markers map pose

## Running as Components

The nodes can be run as composable components for better performance:

```bash
ros2 run rclcpp_components component_container
```

Then in another terminal:

```bash
ros2 component load /ComponentManager aruco_pose ArucoDetect
ros2 component load /ComponentManager aruco_pose ArucoMap
```

Or use the provided launch file which handles this automatically.

## Map Generation

Generate a map file using the provided script:

```bash
ros2 run aruco_pose genmap.py 0.33 2 4 1 1 0 -o test_map.txt
```

This creates a 2x4 grid of markers with:
- Marker side length: 0.33
- 2 markers along X axis
- 4 markers along Y axis
- 1 unit distance between markers in X
- 1 unit distance between markers in Y
- Starting marker ID: 0
- Output file: test_map.txt

## Running tests

Command for running tests (if available):

```bash
cd ~/ros2_ws
colcon test --packages-select aruco_pose
colcon test-result --verbose
```

## Troubleshooting

### OpenCV not found

If CMake cannot find OpenCV, ensure it's installed and set the OpenCV_DIR:

```bash
export OpenCV_DIR=/usr/lib/x86_64-linux-gnu/cmake/opencv4
# or if built from source:
export OpenCV_DIR=/usr/local/lib/cmake/opencv4
```

### Component not found

Make sure you've sourced the workspace:

```bash
source ~/ros2_ws/install/setup.bash
```

### TF2 errors

Ensure the TF2 buffer has enough time to accumulate transforms. You may need to adjust `transform_timeout` parameter.

## Copyright

Copyright © 2018 Copter Express Technologies. Author: Oleg Kalachev.

Distributed under MIT License (https://opensource.org/licenses/MIT).
