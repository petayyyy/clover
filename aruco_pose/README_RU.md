# Позиционирование с помощью ArUco маркеров

[English documentation](README.md) | [Русская версия документации](README_RU.md)

Пакет `aruco_pose` состоит из двух компонентов ROS2: `aruco_detect` обнаруживает отдельные ArUco-маркеры и оценивает их позы, `aruco_map` обнаруживает карты маркеров, используя выходные данные `aruco_detect`.

## Требования

- **ROS2**: Humble Hawksbill
- **ОС**: Ubuntu 22.04 (Jammy Jellyfish)
- **OpenCV**: 4.x (включен в репозитории Ubuntu 22.04)
- **C++**: Компилятор C++17

## Установка

### 1. Установка ROS2 Humble

Если вы еще не установили ROS2 Humble, следуйте [официальному руководству по установке](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html):

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

### 2. Установка OpenCV 4

OpenCV 4 доступен в репозиториях Ubuntu 22.04. Установите его командой:

```bash
sudo apt update
sudo apt install libopencv-dev libopencv-contrib-dev
```

Для проверки установки OpenCV:

```bash
pkg-config --modversion opencv4
```

Если вам нужно собрать OpenCV из исходников (например, для включения дополнительных функций), выполните следующие шаги:

```bash
# Установка зависимостей для сборки
sudo apt install build-essential cmake git pkg-config libgtk-3-dev \
    libavcodec-dev libavformat-dev libswscale-dev libv4l-dev \
    libxvidcore-dev libx264-dev libjpeg-dev libpng-dev libtiff-dev \
    gfortran openexr libatlas-base-dev python3-dev python3-numpy \
    libtbb2 libtbb-dev libdc1394-22-dev

# Клонирование OpenCV
cd ~
git clone https://github.com/opencv/opencv.git
git clone https://github.com/opencv/opencv_contrib.git
cd opencv
git checkout 4.8.0  # или последняя версия 4.x
cd ../opencv_contrib
git checkout 4.8.0

# Сборка OpenCV
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

### 3. Установка зависимостей ROS2

Установите необходимые пакеты ROS2:

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

### 4. Сборка пакета

Создайте рабочее пространство ROS2 (если у вас его еще нет):

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
```

Клонируйте или скопируйте этот пакет в рабочее пространство:

```bash
# Если используете git:
git clone <repository-url> aruco_pose

# Или скопируйте директорию пакета сюда
```

Установите зависимости рабочего пространства:

```bash
cd ~/ros2_ws
rosdep update
rosdep install --from-paths src --ignore-src -r -y
```

Соберите пакет:

```bash
cd ~/ros2_ws
colcon build --packages-select aruco_pose
```

Подключите рабочее пространство:

```bash
source ~/ros2_ws/install/setup.bash
```

## Быстрый старт

Для запуска узла камеры, детектора маркеров и карт:

```bash
ros2 launch aruco_pose sample.launch.py
```

Вам понадобится узел камеры (например, [`cv_camera`](https://github.com/ros-perception/image_pipeline) или аналогичный драйвер камеры для ROS2), который публикует данные в топики `image_raw` и `camera_info`.

## Узел aruco_detect

`aruco_detect` обнаруживает ArUco маркеры на изображении, публикует их список (с позами), TF-трансформации, маркеры визуализации и обработанное изображение для отладки.

Рекомендуется запускать его как компонент в том же контейнере компонентов, что и узел камеры.

### Параметры

* `dictionary` (*int*) – Словарь ArUco (по умолчанию: 2)
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
* `estimate_poses` (*bool*) – оценивать позы отдельных маркеров (по умолчанию: true)
* `send_tf` (*bool*) – отправлять TF-трансформации (по умолчанию: true)
* `frame_id_prefix` (*string*) – префикс для имен TF-трансформаций, к которому добавляется ID маркера (по умолчанию: `aruco_`)
* `length` (*double*) – длина стороны маркеров (обязательно, если `estimate_poses` = true)
* `length_override.<id>` (*double*) – переопределение длины для конкретного маркера по ID (например, `length_override.3` = 0.1)
* `known_vertical` (*string*) – известная вертикаль (ось Z) всех маркеров как фрейм
* `flip_vertical` (*bool*) – инвертировать вертикальный вектор (по умолчанию: false)
* `auto_flip` (*bool*) – автоматически инвертировать вертикаль при необходимости (по умолчанию: false)
* `enabled` (*bool*) – включить/выключить обнаружение (по умолчанию: true)
* `transform_timeout` (*double*) – таймаут для TF-запросов в секундах (по умолчанию: 0.02)

### Топики

#### Подписки

* `image_raw` (*sensor_msgs/msg/Image*) – изображение с камеры
* `camera_info` (*sensor_msgs/msg/CameraInfo*) – информация о калибровке камеры
* `map_markers` (*aruco_pose/msg/MarkerArray*) – список маркеров для отключения публикации TF-трансформаций

#### Публикации

* `markers` (*aruco_pose/msg/MarkerArray*) – список обнаруженных маркеров с их углами и позами
* `visualization` (*visualization_msgs/msg/MarkerArray*) – маркеры визуализации для rviz2
* `debug` (*sensor_msgs/msg/Image*) – отладочное изображение с обнаруженными маркерами

### Сервисы

* `set_length_override` (*aruco_pose/srv/SetMarkers*) – динамически установить переопределения длины маркеров

### Публикуемые трансформации

* `<camera_frame>` => `<frame_id_prefix><id>` – позы маркеров

## Узел aruco_map

Узел `aruco_map` оценивает позицию карты маркеров.

### Параметры

* `map` (*string*) – путь к текстовому файлу со списком маркеров
* `frame_id` (*string*) – идентификатор публикуемого фрейма (по умолчанию: `aruco_map`)
* `known_vertical` (*string*) – известная вертикаль (ось Z) карты маркеров как фрейм
* `flip_vertical` (*bool*) – инвертировать вертикальный вектор (по умолчанию: false)
* `auto_flip` (*bool*) – автоматически инвертировать вертикаль при необходимости (по умолчанию: false)
* `image_width` (*int*) – ширина отладочного изображения (по умолчанию: 2000)
* `image_height` (*int*) – высота отладочного изображения (по умолчанию: 2000)
* `image_margin` (*int*) – отступ отладочного изображения (по умолчанию: 200)
* `image_axis` (*bool*) – должен ли отладочный файл содержать оси (по умолчанию: true)
* `dictionary` (*int*) – Словарь ArUco (по умолчанию: 2) - должен совпадать с параметром `dictionary` узла `aruco_detect`
* `type` (*string*) – тип карты: "map" или "gridboard" (по умолчанию: "map")
* `enabled` (*bool*) – включить/выключить обнаружение карты (по умолчанию: true)
* `put_markers_count_to_covariance` (*bool*) – поместить количество валидных маркеров в covariance[0] (по умолчанию: false)
* `markers.frame_id` (*string*) – родительский фрейм для статических трансформаций маркеров
* `markers.child_frame_id_prefix` (*string*) – префикс для дочерних фреймов статических трансформаций маркеров

Файл карты содержит по одному маркеру на строку в следующем формате:

```
marker_id marker_length x y z yaw pitch roll
```

Где yaw, pitch и roll - это внешние углы поворота вокруг осей Z, Y, X соответственно.

Примеры см. в директории [`map`](map/).

### Топики

#### Подписки

* `image_raw` (*sensor_msgs/msg/Image*) – изображение с камеры (используется для отладочного изображения)
* `camera_info` (*sensor_msgs/msg/CameraInfo*) – информация о калибровке камеры (используется для отладочного изображения)
* `markers` (*aruco_pose/msg/MarkerArray*) – список маркеров, обнаруженных узлом `aruco_detect`

#### Публикации

* `pose` (*geometry_msgs/msg/PoseWithCovarianceStamped*) – оцененная поза карты
* `map` (*aruco_pose/msg/MarkerArray*) – список маркеров в загруженной карте
* `image` (*sensor_msgs/msg/Image*) – планаризованное изображение карты
* `visualization` (*visualization_msgs/msg/MarkerArray*) – визуализация карты маркеров для rviz2
* `debug` (*sensor_msgs/msg/Image*) – отладочное изображение с обнаруженными маркерами и осями карты

### Публикуемые трансформации

* `<camera_frame>` => `<map_name>` – поза карты маркеров

## Запуск как компонентов

Узлы могут быть запущены как композируемые компоненты для лучшей производительности:

```bash
ros2 run rclcpp_components component_container
```

Затем в другом терминале:

```bash
ros2 component load /ComponentManager aruco_pose ArucoDetect
ros2 component load /ComponentManager aruco_pose ArucoMap
```

Или используйте предоставленный launch-файл, который делает это автоматически.

## Генерация карты

Создайте файл карты с помощью предоставленного скрипта:

```bash
ros2 run aruco_pose genmap.py 0.33 2 4 1 1 0 -o test_map.txt
```

Это создает сетку маркеров 2x4 с:
- Длина стороны маркера: 0.33
- 2 маркера по оси X
- 4 маркера по оси Y
- Расстояние 1 единица между маркерами по X
- Расстояние 1 единица между маркерами по Y
- Начальный ID маркера: 0
- Выходной файл: test_map.txt

## Запуск тестов

Команда для запуска тестов (если доступны):

```bash
cd ~/ros2_ws
colcon test --packages-select aruco_pose
colcon test-result --verbose
```

## Решение проблем

### OpenCV не найден

Если CMake не может найти OpenCV, убедитесь, что он установлен, и установите переменную OpenCV_DIR:

```bash
export OpenCV_DIR=/usr/lib/x86_64-linux-gnu/cmake/opencv4
# или если собрано из исходников:
export OpenCV_DIR=/usr/local/lib/cmake/opencv4
```

### Компонент не найден

Убедитесь, что вы подключили рабочее пространство:

```bash
source ~/ros2_ws/install/setup.bash
```

### Ошибки TF2

Убедитесь, что буфер TF2 имеет достаточно времени для накопления трансформаций. Возможно, потребуется настроить параметр `transform_timeout`.

## Авторские права

Copyright © 2018 Copter Express Technologies. Автор: Oleg Kalachev.

Распространяется под лицензией MIT (https://opensource.org/licenses/MIT).

