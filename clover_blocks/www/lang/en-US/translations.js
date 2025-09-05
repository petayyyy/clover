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
        // Dialog buttons
        'ok': 'OK',
        'cancel': 'Cancel',
        
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
        z: 'height(Z)',
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
        current1: 'current',
        current2: 'current',
        current3: 'current',
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
        marker: 'marker',
        last_navigate_target: 'last navigate target',
        map: 'map (global coordinate system)',
        terrain: 'terrain',
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
        timeout_s: 'timeout, s',

        // Tooltips
        tooltip_navigate: 'Navigate to the specified point, coordinates are in meters.',
        tooltip_set_velocity: 'Set the drone velocity in meters per second (cancels navigation requests).',
        tooltip_setpoint: "Set the drone's setpoints of different types (cancels navigation requests).",
        tooltip_get_position: 'Returns current position or velocity in meters or meters per second.',
        tooltip_get_yaw: 'Returns current yaw in degree (not radian).',
        tooltip_get_attitude: 'Returns current orientation or angle rates in degree or degree per second (not radian).',
        tooltip_voltage: 'Returns current battery voltage in volts.',
        tooltip_get_rc: 'Returns current RC channel value.',
        tooltip_armed: 'Returns if the drone armed.',
        tooltip_mode: 'Returns current flight mode (POSCTL, OFFBOARD, etc).',
        tooltip_wait_arrival: 'Wait until the drone arrives to the navigation target.',
        tooltip_get_time: 'Returns current timestamp in seconds.',
        tooltip_arrived: 'Returns if the drone arrived to the navigation target.',
        tooltip_set_led: 'Set an individual LED to specified color.',
        tooltip_set_effect: 'Set desired LED strip effect.',
        tooltip_led_count: 'Returns the number of LEDs (configured in led.launch).',
        tooltip_take_off: 'Take off on desired altitude in meters.',
        tooltip_land: 'Land the drone.',
        tooltip_global_position: 'Returns current global position (latitude, longitude, altitude above the WGS 84 ellipsoid).',
        tooltip_set_yaw: 'Rotate the drone to the specified angle in degree (not radian).',
        tooltip_distance: 'Returns the distance to the given point in meters.',
        tooltip_gpio_read: 'Returns if there is voltage on a GPIO pin.',
        tooltip_gpio_write: 'Set GPIO pin level.',
        tooltip_set_servo: 'Set PWM on a GPIO pin to control servo. PWM is specified in range of 500–2500 μs.',
        tooltip_set_duty_cycle: 'Set PWM duty cycle on a GPIO pin (better to control LEDs, etc). Duty cycle is set in range of 0–1.',
        tooltip_scan_qr: 'Returns data from the first detected QR code within timeout.'
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
