// Russian localization file for Clover Blocks
// This file contains all text strings used in the interface
// TODO: Translate all English strings to Russian

const ruRU = {
    // Main interface elements
    'title': 'ПОПКА', // TODO: Translate to Russian
    'blocks_tab': 'Кринж', // TODO: Translate to Russian
    'python_tab': 'Код', // TODO: Translate to Russian
    
    // Connection status
    'disconnected': 'Disconnected', // TODO: Translate to Russian
    'backend_fail': 'Failed to contact with <code>clover_blocks</code> node, see <a href="../clover/docs/en/blocks.html#configuration" target="_blank">configuration</a> documentation.', // TODO: Translate to Russian
    'running': 'В процессе...', // TODO: Translate to Russian
    
    // Program management
    'unsaved': '<Unsaved>', // TODO: Translate to Russian
    'clear': 'Clear...', // TODO: Translate to Russian
    'save': 'Save... (Ctrl+S)', // TODO: Translate to Russian
    'user_programs': 'User', // TODO: Translate to Russian
    'example_programs': 'Examples', // TODO: Translate to Russian
    'files_saved_in': 'Files are saved in <package_path>/programs/.', // TODO: Translate to Russian
    
    // Buttons
    'run_button': 'Запуск', // TODO: Translate to Russian
    'stop_button': 'Прервать', // TODO: Translate to Russian
    'land_button': 'Посадить', // TODO: Translate to Russian
    'run_tooltip': 'Запустить программу', // TODO: Translate to Russian
    'stop_tooltip': 'Stop the program', // TODO: Translate to Russian
    'land_tooltip': 'Stop the program and land', // TODO: Translate to Russian
    
    // Dialogs and confirmations
    'run_program_confirm': 'Запустить программу?', // TODO: Translate to Russian
    'clear_workspace_confirm': 'Clear workspace?', // TODO: Translate to Russian
    'discard_changes_confirm': 'Discard changes?', // TODO: Translate to Russian
    'enter_program_name': 'Enter new program name:', // TODO: Translate to Russian
    
    // Error messages
    'error_prefix': 'Error: ', // TODO: Translate to Russian
    'unable_to_land': 'Unable to land: ', // TODO: Translate to Russian
    'unable_to_store': 'Unable to store: ', // TODO: Translate to Russian
    'error_loading_programs': 'Error loading programs list.\n\nHave you enabled \'blocks\' in clover.launch?', // TODO: Translate to Russian
    
    // Block categories
    'flight_category': 'Flight', // TODO: Translate to Russian
    'state_category': 'State', // TODO: Translate to Russian
    'led_category': 'LED', // TODO: Translate to Russian
    'gpio_category': 'GPIO', // TODO: Translate to Russian
    'logic_category': 'Logic', // TODO: Translate to Russian
    'loops_category': 'Loops', // TODO: Translate to Russian
    'math_category': 'Math', // TODO: Translate to Russian
    'text_category': 'Text', // TODO: Translate to Russian
    'lists_category': 'Lists', // TODO: Translate to Russian
    'colour_category': 'Colour', // TODO: Translate to Russian
    'variables_category': 'Variables', // TODO: Translate to Russian
    'functions_category': 'Functions', // TODO: Translate to Russian
    
    // Block names and descriptions
    'take_off_block': 'Take off', // TODO: Translate to Russian
    'navigate_block': 'Navigate', // TODO: Translate to Russian
    'land_block': 'Land', // TODO: Translate to Russian
    'set_yaw_block': 'Set yaw', // TODO: Translate to Russian
    'wait_block': 'Wait', // TODO: Translate to Russian
    'wait_arrival_block': 'Wait arrival', // TODO: Translate to Russian
    'setpoint_block': 'Setpoint', // TODO: Translate to Russian
    'get_position_block': 'Get position', // TODO: Translate to Russian
    'get_yaw_block': 'Get yaw', // TODO: Translate to Russian
    'get_attitude_block': 'Get attitude', // TODO: Translate to Russian
    'global_position_block': 'Global position', // TODO: Translate to Russian
    'distance_block': 'Distance', // TODO: Translate to Russian
    'get_time_block': 'Get time', // TODO: Translate to Russian
    'arrived_block': 'Arrived', // TODO: Translate to Russian
    'rangefinder_distance_block': 'Rangefinder distance', // TODO: Translate to Russian
    'mode_block': 'Mode', // TODO: Translate to Russian
    'armed_block': 'Armed', // TODO: Translate to Russian
    'voltage_block': 'Voltage', // TODO: Translate to Russian
    'get_rc_block': 'Get RC', // TODO: Translate to Russian
    'set_effect_block': 'Set effect', // TODO: Translate to Russian
    'set_led_block': 'Set LED', // TODO: Translate to Russian
    'led_count_block': 'LED count', // TODO: Translate to Russian
    'gpio_read_block': 'GPIO read', // TODO: Translate to Russian
    'gpio_write_block': 'GPIO write', // TODO: Translate to Russian
    'set_servo_block': 'Set servo', // TODO: Translate to Russian
    'set_duty_cycle_block': 'Set duty cycle', // TODO: Translate to Russian
    
    // Block fields
    'altitude': 'Altitude', // TODO: Translate to Russian
    'x_coord': 'X', // TODO: Translate to Russian
    'y_coord': 'Y', // TODO: Translate to Russian
    'z_coord': 'Z', // TODO: Translate to Russian
    'latitude': 'Latitude', // TODO: Translate to Russian
    'longitude': 'Longitude', // TODO: Translate to Russian
    'speed': 'Speed', // TODO: Translate to Russian
    'id': 'ID', // TODO: Translate to Russian
    'yaw': 'Yaw', // TODO: Translate to Russian
    'time': 'Time', // TODO: Translate to Russian
    'frame_id': 'Frame ID', // TODO: Translate to Russian
    'color': 'Color', // TODO: Translate to Russian
    'index': 'Index', // TODO: Translate to Russian
    'pin': 'Pin', // TODO: Translate to Russian
    'level': 'Level', // TODO: Translate to Russian
    'pwm': 'PWM', // TODO: Translate to Russian
    'duty_cycle': 'Duty cycle', // TODO: Translate to Russian
    'channel': 'Channel', // TODO: Translate to Russian
    
    // Logic blocks
    'if_block': 'if', // TODO: Translate to Russian
    'else_block': 'else', // TODO: Translate to Russian
    'else_if_block': 'else if', // TODO: Translate to Russian
    'compare_block': 'Compare', // TODO: Translate to Russian
    'operation_block': 'Operation', // TODO: Translate to Russian
    'negate_block': 'Not', // TODO: Translate to Russian
    'boolean_block': 'Boolean', // TODO: Translate to Russian
    'null_block': 'Null', // TODO: Translate to Russian
    'ternary_block': 'Ternary', // TODO: Translate to Russian
    
    // Loop blocks
    'repeat_block': 'Repeat', // TODO: Translate to Russian
    'while_block': 'While', // TODO: Translate to Russian
    'for_block': 'For', // TODO: Translate to Russian
    'for_each_block': 'For each', // TODO: Translate to Russian
    'break_block': 'Break', // TODO: Translate to Russian
    'continue_block': 'Continue', // TODO: Translate to Russian
    
    // Math blocks
    'number_block': 'Number', // TODO: Translate to Russian
    'arithmetic_block': 'Arithmetic', // TODO: Translate to Russian
    'single_math_block': 'Single math', // TODO: Translate to Russian
    'trig_block': 'Trigonometry', // TODO: Translate to Russian
    'constant_block': 'Constant', // TODO: Translate to Russian
    'number_property_block': 'Number property', // TODO: Translate to Russian
    'round_block': 'Round', // TODO: Translate to Russian
    'list_math_block': 'List math', // TODO: Translate to Russian
    'modulo_block': 'Modulo', // TODO: Translate to Russian
    'constrain_block': 'Constrain', // TODO: Translate to Russian
    'random_int_block': 'Random integer', // TODO: Translate to Russian
    'random_float_block': 'Random float', // TODO: Translate to Russian
    
    // Text blocks
    'text_block': 'Text', // TODO: Translate to Russian
    'join_block': 'Join', // TODO: Translate to Russian
    'append_block': 'Append', // TODO: Translate to Russian
    'length_block': 'Length', // TODO: Translate to Russian
    'is_empty_block': 'Is empty', // TODO: Translate to Russian
    'index_of_block': 'Index of', // TODO: Translate to Russian
    'char_at_block': 'Char at', // TODO: Translate to Russian
    'substring_block': 'Substring', // TODO: Translate to Russian
    'change_case_block': 'Change case', // TODO: Translate to Russian
    'trim_block': 'Trim', // TODO: Translate to Russian
    'print_block': 'Print', // TODO: Translate to Russian
    'prompt_block': 'Prompt', // TODO: Translate to Russian
    
    // List blocks
    'create_list_block': 'Create list', // TODO: Translate to Russian
    'repeat_list_block': 'Repeat list', // TODO: Translate to Russian
    'list_length_block': 'List length', // TODO: Translate to Russian
    'list_is_empty_block': 'List is empty', // TODO: Translate to Russian
    'list_index_of_block': 'List index of', // TODO: Translate to Russian
    'list_get_block': 'List get', // TODO: Translate to Russian
    'list_set_block': 'List set', // TODO: Translate to Russian
    'list_sublist_block': 'List sublist', // TODO: Translate to Russian
    'list_split_block': 'List split', // TODO: Translate to Russian
    'list_sort_block': 'List sort', // TODO: Translate to Russian
    
    // Color blocks
    'color_picker_block': 'Color picker', // TODO: Translate to Russian
    'random_color_block': 'Random color', // TODO: Translate to Russian
    'rgb_color_block': 'RGB color', // TODO: Translate to Russian
    'blend_color_block': 'Blend color', // TODO: Translate to Russian
    
    // Variables and functions
    'variables_block': 'Variables', // TODO: Translate to Russian
    'functions_block': 'Functions', // TODO: Translate to Russian
    
    // Success messages
    'program_saved': 'Program saved successfully', // TODO: Translate to Russian
    'program_loaded': 'Program loaded successfully', // TODO: Translate to Russian
    
    // Time format
    'time_format': '{hours}:{minutes}:{seconds}', // TODO: Translate to Russian
    
    // Language selector
    'language_selector': 'Language', // TODO: Translate to Russian
    'english': 'English', // TODO: Translate to Russian
    'russian': 'Русский', // TODO: Translate to Russian
    
    // Tooltips
    'save_tooltip': 'Save current program (Ctrl+S)', // TODO: Translate to Russian
    'load_tooltip': 'Load program from list', // TODO: Translate to Russian
    'clear_tooltip': 'Clear workspace', // TODO: Translate to Russian
    'language_tooltip': 'Select interface language' // TODO: Translate to Russian
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ruRU;
} else if (typeof window !== 'undefined') {
    window.ruRU = ruRU;
}
