// Russian localization file for Clover Blocks
// This file contains all text strings used in the interface

const ruRU = {
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
    'flight_category': 'Модули полета', 
    'state_category': 'Модули состояний', 
    'led_category': 'Модули индикации', 
    'gpio_category': 'Модули ввода/вывода', 
    'logic_category': 'Модули логики', 
    'loops_category': 'Модули циклов', 
    'math_category': 'Модули вычислений', 
    'text_category': 'Модули текста', 
    'lists_category': 'Модули списков', 
    'colour_category': 'Модули цветов', 
    'variables_category': 'Модули переменных', 
    'functions_category': 'Модули функций', 
    
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
};

// Метки блоков (ключи используются в blocks.js)
ruRU['blk_forward'] = 'вперёд';
ruRU['blk_left'] = 'влево';
ruRU['blk_up'] = 'вверх';
ruRU['blk_x'] = 'x';
ruRU['blk_y'] = 'y';
ruRU['blk_z'] = 'z';
ruRU['blk_altitude'] = 'высота';
ruRU['blk_global_local'] = 'глобальные';
ruRU['blk_global_wgs_alt'] = 'глобальные, выс. WGS 84';
ruRU['blk_navigate_to_point'] = 'полет к точке';
ruRU['blk_latitude'] = 'широта';
ruRU['blk_longitude'] = 'долгота';
ruRU['blk_relative_to'] = 'относительно';
ruRU['blk_with_id'] = 'с ID';
ruRU['blk_with_speed'] = 'со скоростью';
ruRU['blk_wait'] = 'ждать';
ruRU['blk_set_velocity'] = 'установить скорость';
ruRU['blk_set'] = 'установить';
ruRU['blk_velocity'] = 'скорость';
ruRU['blk_attitude'] = 'ориентация';
ruRU['blk_angular_rates'] = 'угловые скорости';
ruRU['blk_vx'] = 'vx';
ruRU['blk_vy'] = 'vy';
ruRU['blk_vz'] = 'vz';
ruRU['blk_roll'] = 'крен';
ruRU['blk_pitch'] = 'тангаж';
ruRU['blk_yaw'] = 'рыскание';
ruRU['blk_thrust'] = 'тяга';
ruRU['blk_rangefinder_distance'] = 'текущая дистанция дальномера';
ruRU['blk_current'] = 'текущий';
ruRU['blk_current_yaw_relative_to'] = 'текущее рыскание относительно';
ruRU['blk_roll_rate'] = 'скорость крена';
ruRU['blk_pitch_rate'] = 'скорость тангажа';
ruRU['blk_yaw_rate'] = 'скорость рыскания';
ruRU['blk_total'] = 'суммарное';
ruRU['blk_cell'] = 'ячейки';
ruRU['blk_voltage'] = 'напряжение';
ruRU['blk_rc_channel'] = 'канал RC';
ruRU['blk_armed_q'] = 'запущены?';
ruRU['blk_current_flight_mode'] = 'текущий режим полёта';
ruRU['blk_wait_arrival'] = 'ждать прибытия';
ruRU['blk_time'] = 'время';
ruRU['blk_arrived_q'] = 'прибыл?';
ruRU['blk_set_led'] = 'установить светодиод';
ruRU['blk_to_color'] = 'в цвет';
ruRU['blk_set_led_effect'] = 'установить эффект LED';
ruRU['blk_fill'] = 'заливка';
ruRU['blk_blink'] = 'мигание';
ruRU['blk_blink_fast'] = 'быстрое мигание';
ruRU['blk_fade'] = 'затухание';
ruRU['blk_wipe'] = 'протяжка';
ruRU['blk_flash'] = 'вспышка';
ruRU['blk_rainbow'] = 'радуга';
ruRU['blk_rainbow_fill'] = 'заливка радугой';
ruRU['blk_with_color'] = 'с цветом';
ruRU['blk_led_count'] = 'кол-во LED';
ruRU['blk_take_off_to'] = 'взлёт на';
ruRU['blk_land'] = 'посадка';
ruRU['blk_when_took_off'] = 'Когда взлетел';
ruRU['blk_when_landed'] = 'Когда приземлился';
ruRU['blk_when_armed'] = 'Когда запущены моторы';
ruRU['blk_rotate_by'] = 'повернуть на';
ruRU['blk_body'] = 'корпус';
ruRU['blk_markers_map'] = 'карта маркеров';
ruRU['blk_last_navigate_target'] = 'последняя цель навигации';
ruRU['blk_distance_to_point'] = 'расстояние до точки';
ruRU['blk_seconds'] = 'секунд';
ruRU['blk_key'] = 'клавиша';
ruRU['blk_pressed'] = 'нажата';
ruRU['blk_read_gpio_pin'] = 'читать пин GPIO';
ruRU['blk_set_gpio_pin'] = 'установить пин GPIO';
ruRU['blk_to'] = 'в';
ruRU['blk_to_pwm'] = 'в PWM';
ruRU['blk_to_duty_cycle'] = 'в скважность';
ruRU['blk_scan_qr_data'] = 'считать QR данные';
ruRU['blk_timeout_s'] = 'таймаут, с';

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
