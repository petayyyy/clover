from launch import LaunchDescription
from launch_ros.actions import ComposableNodeContainer
from launch_ros.descriptions import ComposableNode
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():
    share_dir = get_package_share_directory('aruco_pose')
    
    return LaunchDescription([
        DeclareLaunchArgument(
            'camera_frame_id',
            default_value='main_camera_optical',
            description='Camera frame ID'
        ),
        DeclareLaunchArgument(
            'camera_info_url',
            default_value=os.path.join(share_dir, 'test', 'camera_info.yaml'),
            description='Camera info URL'
        ),
        DeclareLaunchArgument(
            'image_width',
            default_value='640',
            description='Image width'
        ),
        DeclareLaunchArgument(
            'image_height',
            default_value='480',
            description='Image height'
        ),
        DeclareLaunchArgument(
            'marker_length',
            default_value='0.33',
            description='Marker side length'
        ),
        DeclareLaunchArgument(
            'map_file',
            default_value=os.path.join(share_dir, 'map', 'map.txt'),
            description='Map file path'
        ),
        
        ComposableNodeContainer(
            name='aruco_container',
            namespace='',
            package='rclcpp_components',
            executable='component_container',
            composable_node_descriptions=[
                # Camera node (assuming cv_camera is available as ROS2 component)
                # ComposableNode(
                #     package='cv_camera',
                #     plugin='cv_camera::CvCameraNodelet',
                #     name='main_camera',
                #     parameters=[{
                #         'frame_id': LaunchConfiguration('camera_frame_id'),
                #         'camera_info_url': LaunchConfiguration('camera_info_url'),
                #         'image_width': LaunchConfiguration('image_width'),
                #         'image_height': LaunchConfiguration('image_height'),
                #     }]
                # ),
                
                # ArUco detect node
                ComposableNode(
                    package='aruco_pose',
                    plugin='ArucoDetect',
                    name='aruco_detect',
                    parameters=[{
                        'length': LaunchConfiguration('marker_length'),
                    }],
                    remappings=[
                        ('image_raw', 'main_camera/image_raw'),
                        ('camera_info', 'main_camera/camera_info'),
                    ]
                ),
                
                # ArUco map node
                ComposableNode(
                    package='aruco_pose',
                    plugin='ArucoMap',
                    name='aruco_map',
                    parameters=[{
                        'map': LaunchConfiguration('map_file'),
                    }],
                    remappings=[
                        ('image_raw', 'main_camera/image_raw'),
                        ('camera_info', 'main_camera/camera_info'),
                        ('markers', 'aruco_detect/markers'),
                    ]
                ),
            ],
            output='screen',
        ),
    ])

