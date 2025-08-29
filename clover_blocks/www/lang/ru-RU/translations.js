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
        'stop_button': 'Прервать', 
        'land_button': 'Приземлиться', 
        'run_tooltip': 'Запустить программу', 
        'stop_tooltip': 'Остановить программу', 
        'land_tooltip': 'Остановить программу и приземлиться', 
        
        // Dialogs and confirmations
        'run_program_confirm': 'Запустить программу?', 
        'clear_workspace_confirm': 'Очистить рабочее пространство?', 
        'discard_changes_confirm': 'Отменить изменения?', 
        'enter_program_name': 'Введите новое название программы:', 
        
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
        
        // Block names and descriptions
        'take_off_block': 'Взлёт', 
        'navigate_block': 'Полет в', 
        'land_block': 'Посадка', 
        'set_yaw_block': 'Установить угол', 
        'wait_block': 'Ожидание', 
        'wait_arrival_block': 'Ождание прибытия', 
        'setpoint_block': 'Целевая позиция', 
        'get_position_block': 'Получить позицию', 
        'get_yaw_block': 'Получить угол', 
        'get_attitude_block': 'Получить отношение', 
        'global_position_block': 'Положение по GPS', 
        'distance_block': 'Расстояние', 
        'get_time_block': 'Получить время', 
        'arrived_block': 'Прибыл?', 
        'rangefinder_distance_block': 'Значение с дальномера', 
        'mode_block': 'Режим', 
        'armed_block': 'Запустить моторы', 
        'voltage_block': 'Вольтаж', 
        'get_rc_block': 'Получить RC', 
        'set_effect_block': 'Установить эффект', 
        'set_led_block': 'Установить цвет индикации', 
        'led_count_block': 'Количество светодиодов', 
        'gpio_read_block': 'Чтение с пинов', 
        'gpio_write_block': 'Запись на пины', 
        'set_servo_block': 'Управление сервоприводом', 
        'set_duty_cycle_block': 'Установить рабочий цикл', 
        
        // Block fields
        'altitude': 'Высота над уровнем моря', 
        'x_coord': 'X', 
        'y_coord': 'Y', 
        'z_coord': 'Z', 
        'latitude': 'Широта', 
        'longitude': 'Долгота', 
        'speed': 'Скорость', 
        'id': 'Идентификатор', 
        'yaw': 'Рыскание', 
        'time': 'Время', 
        'frame_id': 'Идентификатор навигации', 
        'color': 'Цвет', 
        'index': 'Индекс', 
        'pin': 'Pin', 
        'level': 'Уровень', 
        'pwm': 'ШИМ', 
        'duty_cycle': 'Рабочий цикл', 
        'channel': 'Канал', 
        
        // Logic blocks
        'if_block': 'Если', 
        'else_block': 'Иначе', 
        'else_if_block': 'Иначе, если', 
        'compare_block': 'Сравнить', 
        'operation_block': 'Операция', 
        'negate_block': 'Не', 
        'boolean_block': 'Логическое значение', 
        'null_block': 'Нулевой', 
        'ternary_block': 'Троичный', 
        
        // Loop blocks
        'repeat_block': 'Повторить', 
        'while_block': 'Пока', 
        'for_block': 'Для', 
        'for_each_block': 'Для каждого', 
        'break_block': 'Прервать', 
        'continue_block': 'Продолжить', 
        
        // Math blocks
        'number_block': 'Число', 
        'arithmetic_block': 'Арифметика', 
        'single_math_block': 'Число одинарной точности', //!
        'trig_block': 'Тригонометрия', 
        'constant_block': 'Константа', 
        'number_property_block': 'Свойство числа', 
        'round_block': 'Округление', 
        'list_math_block': 'Математический список', 
        'modulo_block': 'Модуль', 
        'constrain_block': 'Ограничение', 
        'random_int_block': 'Случайное целое число', 
        'random_float_block': 'Случайное число с плавающей запятой', 
        
        // Text blocks
        'text_block': 'Текст', 
        'join_block': 'Присоединиться', 
        'append_block': 'Добавить', 
        'length_block': 'Длина', 
        'is_empty_block': 'Пустой', 
        'index_of_block': 'Индекс', 
        'char_at_block': 'Символ в', 
        'substring_block': 'Подстрока', 
        'change_case_block': 'Изменить регистр', 
        'trim_block': 'Обрезать', 
        'print_block': 'Печать', 
        'prompt_block': 'Подсказка', 
        
        // List blocks
        'create_list_block': 'Создать список', 
        'repeat_list_block': 'Повторить список', 
        'list_length_block': 'Длина списка', 
        'list_is_empty_block': 'Список пуст', 
        'list_index_of_block': 'Индекс списка', 
        'list_get_block': 'Получение списка', 
        'list_set_block': 'Набор списков', 
        'list_sublist_block': 'Подсписок списка', 
        'list_split_block': 'Разделение списка', 
        'list_sort_block': 'Сортировка списка', 
        
        // Color blocks
        'color_picker_block': 'Пипетка', 
        'random_color_block': 'Случайный цвет', 
        'rgb_color_block': 'Цвет RGB', 
        'blend_color_block': 'Смешать цвета', 
        
        // Variables and functions
        'variables_block': 'Переменные', 
        'functions_block': 'Функции', 
        
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
        forward: 'вперёд',
        left: 'влево',
        up: 'вверх',
        x: 'x',
        y: 'y',
        z: 'z',
        altitude: 'высота',
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
        vx: 'vx',
        vy: 'vy',
        vz: 'vz',
        roll: 'крен',
        pitch: 'тангаж',
        yaw: 'рыскание',
        thrust: 'тяга',
        rangefinder_distance: 'текущая дистанция дальномера',
        current: 'текущий',
        current_yaw_relative_to: 'текущее рыскание относительно',
        roll_rate: 'скорость крена',
        pitch_rate: 'скорость тангажа',
        yaw_rate: 'скорость рыскания',
        total: 'суммарное',
        cell: 'ячейки',
        voltage: 'напряжение',
        rc_channel: 'канал RC',
        armed_q: 'запущены?',
        current_flight_mode: 'текущий режим полёта',
        wait_arrival: 'ждать прибытия',
        time: 'время',
        arrived_q: 'прибыл?',
        set_led: 'установить светодиод',
        to_color: 'в цвет',
        set_led_effect: 'установить эффект LED',
        fill: 'заливка',
        blink: 'мигание',
        blink_fast: 'быстрое мигание',
        fade: 'затухание',
        wipe: 'протяжка',
        flash: 'вспышка',
        rainbow: 'радуга',
        rainbow_fill: 'заливка радугой',
        with_color: 'с цветом',
        led_count: 'кол-во LED',
        take_off_to: 'взлёт на',
        land: 'посадка',
        when_took_off: 'Когда взлетел',
        when_landed: 'Когда приземлился',
        when_armed: 'Когда запущены моторы',
        rotate_by: 'повернуть на',
        body: 'корпус',
        markers_map: 'карта маркеров',
        last_navigate_target: 'последняя цель навигации',
        distance_to_point: 'расстояние до точки',
        seconds: 'секунд',
        key: 'клавиша',
        pressed: 'нажата',
        read_gpio_pin: 'читать пин GPIO',
        set_gpio_pin: 'установить пин GPIO',
        to: 'в',
        to_pwm: 'в PWM',
        to_duty_cycle: 'в скважность',
        scan_qr_data: 'считать QR данные',
        timeout_s: 'таймаут, с'
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
