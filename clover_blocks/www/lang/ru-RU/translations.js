// Russian localization file for Clover Blocks
// This file contains all text strings used in the interface

const ruRu = {
    ui: {
        // Main interface elements
        'title': 'Блочное программирование Clover', 
        'blocks_tab': 'Блоки', 
        'python_tab': 'Код', 
        
        // Connection status
        'disconnected': 'Отключен', 
        'backend_fail': 'Не удалось связаться с узлом <code>clover_blocks</code>, смотрите <a href="../clover/docs/en/blocks.html#configuration" target="_blank">configuration</a> документация по конфигурации.', 
        'running': 'В процессе...', 
        
        // Program management
        'unsaved': '<Несохраненный>', 
        'clear': 'Очистить...', 
        'save': 'Сохранить... (Ctrl+S)', 
        'user_programs': 'Программы пользователя', 
        'example_programs': 'Примеры', 
        'files_saved_in': 'Файлы сохраняются в <package_path>/programs/.', 
        
        // Buttons
        'run_button': 'Запуск', 
        'stop_button': 'СТОП', 
        'land_button': 'Приземлиться', 
        'reset_button': 'Начать сначала', 
        'run_tooltip': 'Запустить программу', 
        'stop_tooltip': 'Остановить программу', 
        'land_tooltip': 'Остановить программу и приземлиться', 
        
        // Dialogs and confirmations
        'run_program_confirm': 'Запустить программу?', 
        'clear_workspace_confirm': 'Очистить рабочее пространство?', 
        'discard_changes_confirm': 'Отменить изменения?', 
        'enter_program_name': 'Введите новое название программы:', 
        // Dialog buttons
        'ok': 'ОК',
        'cancel': 'Отмена',
        
        // Error messages
        'error_prefix': 'Ошибка: ', 
        'unable_to_land': 'Невозможно загрузить: ', 
        'unable_to_store': 'Невозможно сохранить: ', 
        'error_loading_programs': 'Ошибка загрузки списка программ.\n\nВы включили \'blocks\' в clover.launch?', 
        
        // Block categories
        'flight_category': 'Полет', 
        'state_category': 'Состояния', 
        'new_category': 'Новые модули', 
        'led_category': 'Индикация', 
        'gpio_category': 'Ввод/вывод', 
        'logic_category': 'Логика', 
        'loops_category': 'Циклы', 
        'math_category': 'Вычисления', 
        'text_category': 'Текст', 
        'lists_category': 'Списки', 
        'colour_category': 'Цвета', 
        'variables_category': 'Переменные', 
        'functions_category': 'Функции',       
        
        // Success messages
        'program_saved': 'Программа успешно сохранена', 
        'program_loaded': 'Программа загружена успешно', 
        
        // Time format
        'time_format': '{hours}:{minutes}:{seconds}', 
        
        // Language selector
        'language_selector': 'Язык', 
        'english': 'English', 
        'russian': 'Русский', 
        
        // Tooltips
        'save_tooltip': 'Сохранить текущую программу (Ctrl+S)', 
        'load_tooltip': 'Загрузить программу из списка', 
        'clear_tooltip': 'Очистить рабочее пространство', 
        'language_tooltip': 'Выберите язык интерфейса' 
    },
    blocks: {
        forward: 'по горизонтали(X)',
        left: 'по вертикали(Y)',
        up: 'высота(Z)',
        x: 'по горизонтали(X)',
        y: 'по вертикали(Y)',
        z: 'высота(Z)',
        altitude: 'высота(Z)',
        global_local: 'глобальные',
        global_wgs_alt: 'глобальные, выс. WGS 84',
        navigate_to_point: 'полет к точке',
        latitude: 'широта',
        longitude: 'долгота',
        relative_to: 'относительно',
        with_id: 'с ID',
        with_speed: 'со скоростью',
        wait: 'ждать',
        set_velocity: 'установить скорость',
        set: 'установить',
        velocity: 'скорость',
        attitude: 'ориентация',
        angular_rates: 'угловые скорости',
        vx: 'горизонтальная скорость(vx)',
        vy: 'вертикальная скорость(vy)',
        vz: 'глубинная скорость(vz)',
        roll: 'крен',
        pitch: 'тангаж',
        yaw: 'рыскание',
        thrust: 'тяга',
        rangefinder_distance: 'текущая высота с дальномера',
        current1: 'текущий',
        current2: 'текущая',
        current3: 'текущее',
        current_yaw_relative_to: 'текущее рыскание относительно',
        roll_rate: 'скорость крена',
        pitch_rate: 'скорость тангажа',
        yaw_rate: 'скорость рыскания',
        total: 'суммарное',
        cell: 'ячейки',
        voltage: 'напряжение',
        // rc_channel: 'канал RC',
        rc_channel: 'значение с радиоканала',
        armed_q: 'моторы запущены(разблокированы)?',
        current_flight_mode: 'текущий режим полёта',
        wait_arrival: 'ждать, пока дрон достигнет цели',
        time: 'время',
        arrived_q: 'достиг ли дрон цели?',
        set_led: 'установить светодиод',
        to_color: 'в цвет',
        set_led_effect: 'установить эффект на светодиодную ленту',
        fill: 'заливка',
        blink: 'мигание',
        blink_fast: 'быстрое мигание',
        fade: 'затухание',
        wipe: 'протяжка',
        flash: 'вспышка',
        rainbow: 'радуга',
        rainbow_fill: 'заливка радугой',
        with_color: 'с цветом',
        led_count: 'количество светодиодов в ленте',
        take_off_to: 'взлёт на',
        land: 'посадка',
        when_took_off: 'Когда взлетел',
        when_landed: 'Когда приземлился',
        when_armed: 'Когда запущены моторы',
        rotate_by: 'повернуть на',
        body: 'центр дрона',
        markers_map: 'карта маркеров',
        marker: 'маркер',
        last_navigate_target: 'последняя цель навигации',
        map: 'карта (глобальная система координат)',
        terrain: 'рельеф местности',
        distance_to_point: 'расстояние до точки',
        seconds: 'секунд',
        key: 'клавиша',
        pressed: 'нажата',
        read_gpio_pin: 'читать пин GPIO',
        set_gpio_pin: 'установить пин GPIO',
        to: 'в',
        to_pwm: 'в ШИМ',
        to_duty_cycle: 'рабочий цикл',
        scan_qr_data: 'считать QR данные',
        timeout_s: 'таймаут, с',

        // Tooltips
        tooltip_navigate: 'Полёт к заданной точке, координаты в метрах.',
        tooltip_set_velocity: 'Установить скорость дрона в м/с (отменяет запросы навигации).',
        tooltip_setpoint: 'Установить уставки дрона разных типов (отменяет запросы навигации).',
        tooltip_get_position: 'Возвращает текущую позицию или скорость в метрах или м/с.',
        tooltip_get_yaw: 'Возвращает текущее рыскание в градусах (не в радианах).',
        tooltip_get_attitude: 'Возвращает текущую ориентацию или угловые скорости в градусах или град/с (не радианы).',
        tooltip_voltage: 'Возвращает текущее напряжение батареи в вольтах.',
        tooltip_get_rc: 'Возвращает текущее значение канала радиоуправления.',
        tooltip_armed: 'Возвращает, запущены ли моторы дрона.',
        tooltip_mode: 'Возвращает текущий режим полёта (POSCTL, OFFBOARD и т.д.).',
        tooltip_wait_arrival: 'Ждать, пока дрон достигнет цели навигации.',
        tooltip_get_time: 'Возвращает текущую отметку времени в секундах.',
        tooltip_arrived: 'Возвращает, достиг ли дрон цели навигации.',
        tooltip_set_led: 'Установить указанный светодиод в заданный цвет.',
        tooltip_set_effect: 'Установить требуемый эффект для светодиодной ленты.',
        tooltip_led_count: 'Возвращает количество светодиодов (настроено в led.launch).',
        tooltip_take_off: 'Взлёт на заданную высоту в метрах.',
        tooltip_land: 'Посадить дрон.',
        tooltip_global_position: 'Возвращает текущие глобальные координаты (широта, долгота, высота над эллипсоидом WGS 84).',
        tooltip_set_yaw: 'Повернуть дрон на заданный угол в градусах (не радианы).',
        tooltip_distance: 'Возвращает расстояние до заданной точки в метрах.',
        tooltip_gpio_read: 'Возвращает, есть ли напряжение на пине GPIO.',
        tooltip_gpio_write: 'Установить уровень на пине GPIO.',
        tooltip_set_servo: 'Установить ШИМ на пине GPIO для управления сервоприводом. Диапазон ШИМ: 500–2500 мкс.',
        tooltip_set_duty_cycle: 'Установить скважность ШИМ на пине GPIO (подходит для светодиодов и т.п.). Диапазон 0–1.',
        tooltip_scan_qr: 'Возвращает данные первого обнаруженного QR-кода в течение таймаута.'
    }
};

// Build flat map expected by the app and Blockly: ui keys as-is, blocks with blk_ prefix
const ruRU = Object.assign({}, ruRu.ui);
Object.keys(ruRu.blocks).forEach(k => { ruRU['blk_' + k] = ruRu.blocks[k]; });

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ruRU;
} else if (typeof window !== 'undefined') {
    window.ruRU = ruRU;
}
// Apply translations to Blockly
if (typeof Blockly !== 'undefined') {
    Object.assign(Blockly.Msg, ruRU);
}
