# VPE Publisher - Документация

## Описание

`vpe_publisher` - это ROS2 узел для публикации визуальной оценки позиции (Visual Position Estimate, VPE) в систему управления дроном через MAVROS. Модуль предназначен для интеграции данных о позиции из визуальных источников (например, ArUco маркеры, SLAM системы) в систему навигации PX4.

### Основные функции

1. **Получение данных о позиции** из топиков ROS2 или из TF дерева
2. **Преобразование координат** между различными системами координат
3. **Применение смещения (offset)** для синхронизации с локальной системой координат MAVROS
4. **Публикация VPE** в топик `mavros/vision_pose/pose` для использования в PX4
5. **Инициализация локальной позиции** через публикацию нулевых значений (опционально)

## Требования

### Системные требования

- **ОС**: Ubuntu 22.04 (Jammy Jellyfish)
- **ROS2**: Humble Hawksbill
- **Компилятор**: C++17 совместимый (GCC 11+ или Clang 14+)
- **Прошивка PX4**: 1.16.0 или новее

### ROS2 зависимости

Модуль требует следующие ROS2 пакеты:

```bash
# Основные зависимости ROS2
- rclcpp
- geometry_msgs
- tf2
- tf2_ros
- tf2_geometry_msgs
- std_srvs
- std_msgs

# Для работы с PX4 (через MAVROS)
- mavros_msgs (должен быть установлен отдельно)
```

### Внешние зависимости

- **MAVROS**: ROS2 версия для связи с PX4
- **TF2**: Система трансформаций координат ROS2

## Установка и сборка

### Шаг 1: Установка ROS2 Humble

Если ROS2 Humble еще не установлен:

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

# Настройка окружения
source /opt/ros/humble/setup.bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

### Шаг 2: Установка инструментов сборки

```bash
sudo apt install -y \
    python3-colcon-common-extensions \
    python3-rosdep \
    build-essential \
    cmake \
    git
```

### Шаг 3: Установка зависимостей пакета

```bash
# Инициализация rosdep (если еще не сделано)
sudo rosdep init
rosdep update

# Переход в рабочее пространство ROS2
cd ~/ros2_ws/src  # или ваш путь к workspace

# Клонирование репозитория (если еще не сделано)
# git clone <repository_url> clover

# Установка зависимостей
cd ~/ros2_ws
rosdep install --from-paths src --ignore-src -r -y
```

### Шаг 4: Сборка пакета

```bash
# Переход в корень рабочего пространства
cd ~/ros2_ws

# Сборка пакета
colcon build --packages-select clover

# Или сборка всего workspace
colcon build

# Настройка окружения
source install/setup.bash
echo "source ~/ros2_ws/install/setup.bash" >> ~/.bashrc
```

### Шаг 5: Проверка сборки

```bash
# Проверка, что исполняемый файл создан
ls -la ~/ros2_ws/install/clover/lib/clover/vpe_publisher

# Запуск узла (для проверки)
ros2 run clover vpe_publisher
```

## Использование

### Запуск узла

#### Базовый запуск

```bash
ros2 run clover vpe_publisher
```

#### Запуск с параметрами

```bash
ros2 run clover vpe_publisher --ros-args \
    -p frame_id:="aruco_map_detected" \
    -p offset_frame_id:="aruco_map" \
    -p force_init:=true
```

#### Запуск через launch файл

```bash
ros2 launch clover aruco.launch.py aruco_vpe:=true
```

### Параметры узла

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `frame_id` | string | `""` | Имя фрейма в TF дереве для получения VPE данных. Если пусто, данные берутся из топиков |
| `offset_frame_id` | string | `""` | Имя фрейма для публикации смещения в TF. Если пусто, смещение не применяется |
| `local_frame_id` | string | `"map"` | Имя локального фрейма MAVROS (обычно "map") |
| `child_frame_id` | string | `"base_link"` | Имя дочернего фрейма MAVROS (обычно "base_link") |
| `offset_timeout` | double | `3.0` | Таймаут в секундах для пересчета смещения |
| `force_init` | bool | `false` | Включить публикацию нулевых значений для инициализации локальной позиции |
| `publish_zero` | bool | `false` | Устаревшее имя для `force_init` (для обратной совместимости) |
| `force_init_timeout` | double | `5.0` | Таймаут в секундах для проверки наличия VPE перед остановкой публикации нулей |
| `force_init_duration` | double | `5.0` | Длительность в секундах публикации нулевых значений после получения локальной позиции |

### Топики

#### Подписки (Subscriptions)

| Топик | Тип | Описание |
|-------|-----|----------|
| `~/pose` | `geometry_msgs/msg/PoseStamped` | Входные данные о позиции (используется, если `frame_id` пуст) |
| `~/pose_cov` | `geometry_msgs/msg/PoseWithCovarianceStamped` | Входные данные о позиции с ковариацией (используется, если `frame_id` пуст) |
| `mavros/local_position/pose` | `geometry_msgs/msg/PoseStamped` | Локальная позиция от MAVROS (используется только при `force_init=true`) |

#### Публикации (Publications)

| Топик | Тип | Описание |
|-------|-----|----------|
| `~/vpe` | `geometry_msgs/msg/PoseStamped` | Публикуемая визуальная оценка позиции. Обычно ремапится на `mavros/vision_pose/pose` |

#### Сервисы (Services)

| Сервис | Тип | Описание |
|--------|-----|----------|
| `~/reset` | `std_srvs/srv/Trigger` | Сброс смещения (offset). При вызове смещение будет пересчитано при следующем получении данных |

### TF дерево

Узел взаимодействует с TF деревом следующим образом:

- **Чтение**: Если `frame_id` установлен, узел читает трансформацию `frame_id` → `child_frame_id` из TF
- **Публикация**: Если `offset_frame_id` установлен, узел публикует статическую трансформацию смещения

## Примеры использования

### Пример 1: Использование с ArUco маркерами

```bash
ros2 run clover vpe_publisher --ros-args \
    -p frame_id:="aruco_map_detected" \
    -p offset_frame_id:="aruco_map" \
    -p force_init:=true \
    --remap ~/pose_cov:=aruco_map/pose \
    --remap ~/vpe:=mavros/vision_pose/pose
```

### Пример 2: Использование с топиком позиции

```bash
ros2 run clover vpe_publisher --ros-args \
    -p offset_frame_id:="visual_odom_offset" \
    --remap ~/pose:=visual_odometry/pose \
    --remap ~/vpe:=mavros/vision_pose/pose
```

### Пример 3: Использование только TF (без топиков)

```bash
ros2 run clover vpe_publisher --ros-args \
    -p frame_id:="visual_odom" \
    -p child_frame_id:="base_link" \
    -p offset_frame_id:="vpe_offset" \
    --remap ~/vpe:=mavros/vision_pose/pose
```

## Интеграция с PX4

### Настройка PX4

Для использования VPE в PX4 необходимо:

1. **Включить vision_pose_estimate** в параметрах PX4:
   ```bash
   # Через QGroundControl или MAVLink
   EKF2_AID_MASK = 24  # Включить vision position fusion
   ```

2. **Настроить MAVROS** для публикации VPE:
   ```yaml
   # В конфигурации MAVROS
   plugin_whitelist:
     - vision_pose_estimate
   ```

3. **Проверить топик** `mavros/vision_pose/pose` получает данные:
   ```bash
   ros2 topic echo /mavros/vision_pose/pose
   ```

### Совместимость с PX4 1.16.0

Модуль полностью совместим с PX4 прошивкой версии 1.16.0. Используется стандартный интерфейс `vision_pose_estimate` через MAVROS, который не изменился в этой версии.

## Отладка

### Проверка работы узла

```bash
# Проверка, что узел запущен
ros2 node list | grep vpe_publisher

# Просмотр параметров узла
ros2 param list /vpe_publisher
ros2 param get /vpe_publisher frame_id

# Просмотр топиков
ros2 topic list | grep vpe
ros2 topic echo /vpe_publisher/vpe

# Просмотр логов
ros2 topic echo /rosout | grep vpe_publisher
```

### Типичные проблемы

1. **Узел не публикует данные**
   - Проверьте, что входные топики (`~/pose` или `~/pose_cov`) получают данные
   - Проверьте, что `frame_id` правильно настроен (если используется TF)
   - Проверьте логи: `ros2 topic echo /rosout`

2. **Ошибки TF трансформаций**
   - Убедитесь, что TF дерево содержит необходимые фреймы
   - Проверьте: `ros2 run tf2_ros tf2_echo <parent_frame> <child_frame>`
   - Увеличьте таймаут в коде (по умолчанию 0.02 секунды)

3. **PX4 не принимает VPE**
   - Проверьте параметр `EKF2_AID_MASK` в PX4
   - Убедитесь, что MAVROS запущен и подключен к PX4
   - Проверьте, что топик `mavros/vision_pose/pose` публикуется

## Архитектура

### Блок-схема работы

```
[Входные данные]
    │
    ├─> [TF дерево] (если frame_id установлен)
    │       │
    │       └─> [Получение трансформации]
    │
    └─> [Топики pose/pose_cov] (если frame_id пуст)
            │
            └─> [Получение Pose]
                    │
                    ├─> [Применение смещения] (если offset_frame_id установлен)
                    │       │
                    │       └─> [Публикация offset в TF]
                    │
                    └─> [Публикация VPE]
                            │
                            └─> [mavros/vision_pose/pose]
```

### Основные компоненты

1. **TF Buffer/Listener**: Для чтения трансформаций из TF дерева
2. **Static Transform Broadcaster**: Для публикации смещения в TF
3. **Pose Processors**: Обработка входящих данных о позиции
4. **Offset Calculator**: Вычисление и применение смещения координат
5. **Zero Publisher**: Публикация нулевых значений для инициализации (опционально)

## Лицензия

MIT License - см. файл LICENSE в корне репозитория.

## Авторы

- Oleg Kalachev <okalachev@gmail.com>
- Портируно на ROS2 Humble для Ubuntu 22.04

## См. также

- [PX4 Documentation - Vision Position Estimate](https://docs.px4.io/main/en/ros/mavros_offboard.html)
- [MAVROS Documentation](https://github.com/mavlink/mavros)
- [ROS2 TF2 Documentation](https://docs.ros.org/en/humble/Tutorials/Intermediate/Tf2/Tf2-Main.html)

