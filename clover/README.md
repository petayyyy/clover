# `clover` ROS2 package

A bundle for autonomous navigation and drone control.

## Manual installation

### Prerequisites

This package requires:
- Ubuntu 22.04 (Jammy Jellyfish)
- ROS2 Humble Hawksbill
- C++17 compatible compiler
- PX4 firmware 1.16.0 or later

### Step 1: Install ROS2 Humble

Install ROS2 Humble according to the [official documentation](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html):

```bash
# Set locale
sudo apt update && sudo apt install locales
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
export LANG=en_US.UTF-8

# Add ROS2 repository
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -
sudo sh -c 'echo "deb [arch=$(dpkg --print-architecture)] http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/ros2-latest.list'

# Install ROS2 Humble
sudo apt update
sudo apt install ros-humble-desktop -y

# Source ROS2
source /opt/ros/humble/setup.bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

### Step 2: Install build tools and dependencies

```bash
sudo apt install -y \
    python3-colcon-common-extensions \
    python3-rosdep \
    python3-vcstool \
    build-essential \
    cmake \
    git \
    libgeographic-dev \
    geographiclib-tools
```

Initialize rosdep:

```bash
sudo rosdep init
rosdep update
```

### Step 3: Install MAVROS for ROS2

MAVROS for ROS2 needs to be built from source. Create a workspace for MAVROS dependencies:

```bash
mkdir -p ~/mavros_ws/src
cd ~/mavros_ws/src

# Clone MAVROS and dependencies
git clone https://github.com/mavlink/mavros.git -b ros2
git clone https://github.com/PX4/px4_msgs.git
git clone https://github.com/mavlink/mavlink.git -b master

# Install dependencies
cd ~/mavros_ws
rosdep install --from-paths src --ignore-src -y

# Build MAVROS
colcon build --symlink-install

# Source MAVROS workspace
source ~/mavros_ws/install/setup.bash
echo "source ~/mavros_ws/install/setup.bash" >> ~/.bashrc
```

### Step 4: Install GeographicLib datasets

Install GeographicLib datasets required by MAVROS:

```bash
sudo geographiclib-get-geoids egm96-5
```

### Step 5: Create ROS2 workspace and clone clover

Create a ROS2 workspace (using colcon):

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
git clone https://github.com/CopterExpress/clover.git clover
```

### Step 6: Install clover dependencies

Install all required dependencies using rosdep:

```bash
cd ~/ros2_ws
rosdep install -y --from-paths src --ignore-src
```

### Step 7: Build clover package

Build the clover package:

```bash
cd ~/ros2_ws
colcon build --packages-select clover
```

On memory-constrained platforms, you might need to use `-j1`:

```bash
colcon build --packages-select clover --cmake-args -DCMAKE_BUILD_TYPE=Release --parallel-workers 1
```

### Step 8: Source the workspace

Source the workspace to make it available:

```bash
source ~/ros2_ws/install/setup.bash
echo "source ~/ros2_ws/install/setup.bash" >> ~/.bashrc
```

### Step 9: Install udev rules (optional)

You may optionally install udev rules to provide `/dev/px4fmu` symlink to your PX4-based flight controller connected over USB:

```bash
cd ~/ros2_ws/src/clover/udev
sudo cp 99-px4fmu.rules /lib/udev/rules.d
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Alternatively, you may change the `fcu_url` property in the launch file to point to your flight controller device.

## Running

To start connection to the flight controller, use:

```bash
ros2 launch clover clover.launch.py
```

For simulation information, see the [corresponding article](https://clover.coex.tech/en/simulation.html).

> **Note:** The package is configured to connect to `/dev/px4fmu` by default. Install udev rules or specify the path to your FCU device in the launch file.

## Troubleshooting

### MAVROS not found

If you get errors about missing `mavros_msgs`, make sure you have built and sourced the MAVROS workspace:

```bash
source ~/mavros_ws/install/setup.bash
source ~/ros2_ws/install/setup.bash
```

### GeographicLib errors

If you encounter GeographicLib-related errors, ensure the datasets are installed:

```bash
sudo geographiclib-get-geoids egm96-5
```

### Build errors

If you encounter build errors, try cleaning and rebuilding:

```bash
cd ~/ros2_ws
rm -rf build install log
colcon build --packages-select clover
```

---

# Пакет `clover` для ROS2

Пакет для автономной навигации и управления дроном.

## Ручная установка

### Предварительные требования

Для работы пакета требуется:
- Ubuntu 22.04 (Jammy Jellyfish)
- ROS2 Humble Hawksbill
- Компилятор с поддержкой C++17
- Прошивка PX4 версии 1.16.0 или новее

### Шаг 1: Установка ROS2 Humble

Установите ROS2 Humble согласно [официальной документации](https://docs.ros.org/en/humble/Installation/Ubuntu-Install-Debians.html):

```bash
# Установка локали
sudo apt update && sudo apt install locales
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
export LANG=en_US.UTF-8

# Добавление репозитория ROS2
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update && sudo apt install curl -y
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.asc | sudo apt-key add -
sudo sh -c 'echo "deb [arch=$(dpkg --print-architecture)] http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" > /etc/apt/sources.list.d/ros2-latest.list'

# Установка ROS2 Humble
sudo apt update
sudo apt install ros-humble-desktop -y

# Подключение ROS2
source /opt/ros/humble/setup.bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

### Шаг 2: Установка инструментов сборки и зависимостей

```bash
sudo apt install -y \
    python3-colcon-common-extensions \
    python3-rosdep \
    python3-vcstool \
    build-essential \
    cmake \
    git \
    libgeographic-dev \
    geographiclib-tools
```

Инициализация rosdep:

```bash
sudo rosdep init
rosdep update
```

### Шаг 3: Установка MAVROS для ROS2

MAVROS для ROS2 необходимо собрать из исходников. Создайте workspace для зависимостей MAVROS:

```bash
mkdir -p ~/mavros_ws/src
cd ~/mavros_ws/src

# Клонирование MAVROS и зависимостей
git clone https://github.com/mavlink/mavros.git -b ros2
git clone https://github.com/PX4/px4_msgs.git
git clone https://github.com/mavlink/mavlink.git -b master

# Установка зависимостей
cd ~/mavros_ws
rosdep install --from-paths src --ignore-src -y

# Сборка MAVROS
colcon build --symlink-install

# Подключение workspace MAVROS
source ~/mavros_ws/install/setup.bash
echo "source ~/mavros_ws/install/setup.bash" >> ~/.bashrc
```

### Шаг 4: Установка наборов данных GeographicLib

Установите наборы данных GeographicLib, необходимые для MAVROS:

```bash
sudo geographiclib-get-geoids egm96-5
```

### Шаг 5: Создание ROS2 workspace и клонирование clover

Создайте ROS2 workspace (используя colcon):

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
git clone https://github.com/CopterExpress/clover.git clover
```

### Шаг 6: Установка зависимостей clover

Установите все необходимые зависимости с помощью rosdep:

```bash
cd ~/ros2_ws
rosdep install -y --from-paths src --ignore-src
```

### Шаг 7: Сборка пакета clover

Соберите пакет clover:

```bash
cd ~/ros2_ws
colcon build --packages-select clover
```

На системах с ограниченной памятью может потребоваться использовать `-j1`:

```bash
colcon build --packages-select clover --cmake-args -DCMAKE_BUILD_TYPE=Release --parallel-workers 1
```

### Шаг 8: Подключение workspace

Подключите workspace, чтобы сделать его доступным:

```bash
source ~/ros2_ws/install/setup.bash
echo "source ~/ros2_ws/install/setup.bash" >> ~/.bashrc
```

### Шаг 9: Установка правил udev (опционально)

Вы можете установить правила udev для создания симлинка `/dev/px4fmu` к вашему полетному контроллеру на базе PX4, подключенному через USB:

```bash
cd ~/ros2_ws/src/clover/udev
sudo cp 99-px4fmu.rules /lib/udev/rules.d
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Альтернативно, вы можете изменить свойство `fcu_url` в launch-файле, чтобы указать путь к вашему устройству полетного контроллера.

## Запуск

Для запуска подключения к полетному контроллеру используйте:

```bash
ros2 launch clover clover.launch.py
```

Информацию о симуляции см. в [соответствующей статье](https://clover.coex.tech/en/simulation.html).

> **Примечание:** Пакет настроен на подключение к `/dev/px4fmu` по умолчанию. Установите правила udev или укажите путь к вашему устройству FCU в launch-файле.

## Решение проблем

### MAVROS не найден

Если вы получаете ошибки об отсутствии `mavros_msgs`, убедитесь, что вы собрали и подключили workspace MAVROS:

```bash
source ~/mavros_ws/install/setup.bash
source ~/ros2_ws/install/setup.bash
```

### Ошибки GeographicLib

Если вы столкнулись с ошибками, связанными с GeographicLib, убедитесь, что наборы данных установлены:

```bash
sudo geographiclib-get-geoids egm96-5
```

### Ошибки сборки

Если вы столкнулись с ошибками сборки, попробуйте очистить и пересобрать:

```bash
cd ~/ros2_ws
rm -rf build install log
colcon build --packages-select clover
```
