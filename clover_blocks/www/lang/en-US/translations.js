// English localization file for Clover Blocks
// This file contains all text strings used in the interface

const enUs = {
    ui: {
        // Main interface elements
        'title': 'Clover Blocks',
        'blocks_tab': 'Blocks',
        'python_tab': 'Python',
        
        // Connection status
        'disconnected': 'Disconnected',
        'backend_fail': 'Failed to contact with <code>clover_blocks</code> node, see <a href="../clover/docs/en/blocks.html#configuration" target="_blank">configuration</a> documentation.',
        'running': 'Running...',
        
        // Program management
        'unsaved': '<Unsaved>',
        'clear': 'Clear...',
        'save': 'Save... (Ctrl+S)',
        'user_programs': 'User',
        'example_programs': 'Examples',
        'files_saved_in': 'Files are saved in <package_path>/programs/.',
        
        // Buttons
        'run_button': 'Run',
        'stop_button': 'Stop',
        'land_button': 'Land',
        'run_tooltip': 'Run the program',
        'stop_tooltip': 'Stop the program',
        'land_tooltip': 'Stop the program and land',
        
        // Dialogs and confirmations
        'run_program_confirm': 'Run program?',
        'clear_workspace_confirm': 'Clear workspace?',
        'discard_changes_confirm': 'Discard changes?',
        'enter_program_name': 'Enter new program name:',
        
        // Error messages
        'error_prefix': 'Error: ',
        'unable_to_land': 'Unable to land: ',
        'unable_to_store': 'Unable to store: ',
        'error_loading_programs': 'Error loading programs list.\n\nHave you enabled \'blocks\' in clover.launch?',
        
        // Block categories
        'flight_category': 'Flight',
        'state_category': 'State',
        'new_category': 'New modules',
        'led_category': 'LED',
        'gpio_category': 'GPIO',
        'logic_category': 'Logic',
        'loops_category': 'Loops',
        'math_category': 'Math',
        'text_category': 'Text',
        'lists_category': 'Lists',
        'colour_category': 'Colour',
        'variables_category': 'Variables',
        'functions_category': 'Functions',
        
        // Block names and descriptions
        'take_off_block': 'Take off',
        'navigate_block': 'Navigate',
        'land_block': 'Land',
        'set_yaw_block': 'Set yaw',
        'wait_block': 'Wait',
        'wait_arrival_block': 'Wait arrival',
        'setpoint_block': 'Setpoint',
        'get_position_block': 'Get position',
        'get_yaw_block': 'Get yaw',
        'get_attitude_block': 'Get attitude',
        'global_position_block': 'Global position',
        'distance_block': 'Distance',
        'get_time_block': 'Get time',
        'arrived_block': 'Arrived',
        'rangefinder_distance_block': 'Rangefinder distance',
        'mode_block': 'Mode',
        'armed_block': 'Armed',
        'voltage_block': 'Voltage',
        'get_rc_block': 'Get RC',
        'set_effect_block': 'Set effect',
        'set_led_block': 'Set LED',
        'led_count_block': 'LED count',
        'gpio_read_block': 'GPIO read',
        'gpio_write_block': 'GPIO write',
        'set_servo_block': 'Set servo',
        'set_duty_cycle_block': 'Set duty cycle',
        
        // Block fields
        'altitude': 'Altitude',
        'x_coord': 'X',
        'y_coord': 'Y',
        'z_coord': 'Z',
        'latitude': 'Latitude',
        'longitude': 'Longitude',
        'speed': 'Speed',
        'id': 'ID',
        'yaw': 'Yaw',
        'time': 'Time',
        'frame_id': 'Frame ID',
        'color': 'Color',
        'index': 'Index',
        'pin': 'Pin',
        'level': 'Level',
        'pwm': 'PWM',
        'duty_cycle': 'Duty cycle',
        'channel': 'Channel',
        
        // Logic blocks
        'if_block': 'if',
        'else_block': 'else',
        'else_if_block': 'else if',
        'compare_block': 'Compare',
        'operation_block': 'Operation',
        'negate_block': 'Not',
        'boolean_block': 'Boolean',
        'null_block': 'Null',
        'ternary_block': 'Ternary',
        
        // Loop blocks
        'repeat_block': 'Repeat',
        'while_block': 'While',
        'for_block': 'For',
        'for_each_block': 'For each',
        'break_block': 'Break',
        'continue_block': 'Continue',
        
        // Math blocks
        'number_block': 'Number',
        'arithmetic_block': 'Arithmetic',
        'single_math_block': 'Single math',
        'trig_block': 'Trigonometry',
        'constant_block': 'Constant',
        'number_property_block': 'Number property',
        'round_block': 'Round',
        'list_math_block': 'List math',
        'modulo_block': 'Modulo',
        'constrain_block': 'Constrain',
        'random_int_block': 'Random integer',
        'random_float_block': 'Random float',
        
        // Text blocks
        'text_block': 'Text',
        'join_block': 'Join',
        'append_block': 'Append',
        'length_block': 'Length',
        'is_empty_block': 'Is empty',
        'index_of_block': 'Index of',
        'char_at_block': 'Char at',
        'substring_block': 'Substring',
        'change_case_block': 'Change case',
        'trim_block': 'Trim',
        'print_block': 'Print',
        'prompt_block': 'Prompt',
        
        // List blocks
        'create_list_block': 'Create list',
        'repeat_list_block': 'Repeat list',
        'list_length_block': 'List length',
        'list_is_empty_block': 'List is empty',
        'list_index_of_block': 'List index of',
        'list_get_block': 'List get',
        'list_set_block': 'List set',
        'list_sublist_block': 'List sublist',
        'list_split_block': 'List split',
        'list_sort_block': 'List sort',
        
        // Color blocks
        'color_picker_block': 'Color picker',
        'random_color_block': 'Random color',
        'rgb_color_block': 'RGB color',
        'blend_color_block': 'Blend color',
        
        // Variables and functions
        'variables_block': 'Variables',
        'functions_block': 'Functions',
        
        // Success messages
        'program_saved': 'Program saved successfully',
        'program_loaded': 'Program loaded successfully',
        
        // Time format
        'time_format': '{hours}:{minutes}:{seconds}',
        
        // Language selector
        'language_selector': 'Language',
        'english': 'English',
        'russian': 'Русский',
        
        // Tooltips
        'save_tooltip': 'Save current program (Ctrl+S)',
        'load_tooltip': 'Load program from list',
        'clear_tooltip': 'Clear workspace',
        'language_tooltip': 'Select interface language'
    },
    blocks: {
        forward: 'forward',
        left: 'left',
        up: 'up',
        x: 'x',
        y: 'y',
        z: 'z',
        altitude: 'altitude',
        global_local: 'global',
        global_wgs_alt: 'global, WGS 84 alt.',
        navigate_to_point: 'navigate to point',
        latitude: 'latitude',
        longitude: 'longitude',
        relative_to: 'relative to',
        with_id: 'with ID',
        with_speed: 'with speed',
        wait: 'wait',
        set_velocity: 'set velocity',
        set: 'set',
        velocity: 'velocity',
        attitude: 'attitude',
        angular_rates: 'angular rates',
        vx: 'vx',
        vy: 'vy',
        vz: 'vz',
        roll: 'roll',
        pitch: 'pitch',
        yaw: 'yaw',
        thrust: 'thrust',
        rangefinder_distance: 'current rangefinder distance',
        current: 'current',
        current_yaw_relative_to: 'current yaw relative to',
        roll_rate: 'roll rate',
        pitch_rate: 'pitch rate',
        yaw_rate: 'yaw rate',
        total: 'total',
        cell: 'cell',
        voltage: 'voltage',
        rc_channel: 'RC channel',
        armed_q: 'armed?',
        current_flight_mode: 'current flight mode',
        wait_arrival: 'wait arrival',
        time: 'time',
        arrived_q: 'arrived?',
        set_led: 'set LED',
        to_color: 'to color',
        set_led_effect: 'set LED effect',
        fill: 'fill',
        blink: 'blink',
        blink_fast: 'fast blink',
        fade: 'fade',
        wipe: 'wipe',
        flash: 'flash',
        rainbow: 'rainbow',
        rainbow_fill: 'rainbow fill',
        with_color: 'with color',
        led_count: 'LED count',
        take_off_to: 'take off to',
        land: 'land',
        when_took_off: 'When took off',
        when_landed: 'When landed',
        when_armed: 'when armed',
        rotate_by: 'rotate by',
        body: 'body',
        markers_map: 'markers map',
        last_navigate_target: 'last navigate target',
        distance_to_point: 'distance to point',
        seconds: 'seconds',
        key: 'key',
        pressed: 'pressed',
        read_gpio_pin: 'read GPIO pin',
        set_gpio_pin: 'set GPIO pin',
        to: 'to',
        to_pwm: 'to PWM',
        to_duty_cycle: 'to duty cycle',
        scan_qr_data: 'scan QR data',
        timeout_s: 'timeout, s'
    }
};

// Build flat map expected by the app and Blockly
const enUS = Object.assign({}, enUs.ui);
Object.keys(enUs.blocks).forEach(k => { enUS['blk_' + k] = enUs.blocks[k]; });

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = enUS;
} else if (typeof window !== 'undefined') {
    window.enUS = enUS;
}
