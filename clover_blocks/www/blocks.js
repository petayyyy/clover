/*
 * Copyright (C) 2020 Copter Express Technologies
 *
 * Author: Oleg Kalachev <okalachev@gmail.com>
 *
 * Distributed under MIT License (available at https://opensource.org/licenses/MIT).
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

const COLOR_FLIGHT = 293;
const COLOR_STATE = 36;
const COLOR_LED = 143;
const COLOR_GPIO = 200;
const DOCS_URL = 'https://clover.coex.tech/en/blocks.html';

// Localization helper: tries i18n, then Blockly.Msg, then fallback
function L(key, fallback) {
    try {
        if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.t === 'function') {
            const t = window.i18n.t(key);
            if (t && t !== key) return t;
        }
        if (typeof Blockly !== 'undefined' && Blockly.Msg && Blockly.Msg[key]) {
            return Blockly.Msg[key];
        }
    } catch (e) {}
    return fallback !== undefined ? fallback : key;
}

var frameIds = [["body", "BODY"], ["markers map", "ARUCO_MAP"], ["marker", "ARUCO"], ["last navigate target", "NAVIGATE_TARGET"], ["map", "MAP"]];
var frameIdsWithTerrain = frameIds.concat([["terrain", "TERRAIN"]]);

function considerFrameId(e) {
	if (!(e instanceof Blockly.Events.Change || e instanceof Blockly.Events.Create)) return;

	var frameId = this.getFieldValue('FRAME_ID');
	// set appropriate coordinates labels
	if (this.getInput('X')) { // block has x-y-z fields
		if (frameId == 'BODY' || frameId == 'NAVIGATE_TARGET' || frameId == 'BASE_LINK' || frameId == 'TERRAIN') {
			this.getInput('X').fieldRow[0].setValue(L('blk_forward', 'forward'));
			this.getInput('Y').fieldRow[0].setValue(L('blk_left', 'left'));
			this.getInput('Z').fieldRow[0].setValue(L('blk_up', 'up'));
		} else {
			this.getInput('X').fieldRow[0].setValue(L('blk_x', 'x'));
			this.getInput('Y').fieldRow[0].setValue(L('blk_y', 'y'));
			this.getInput('Z').fieldRow[0].setValue(L('blk_z', 'z'));
		}
		if (this.getInput('LAT')) { // block has global coordinates
			let global = frameId.startsWith('GLOBAL');
			this.getInput('LAT').setVisible(global);
			this.getInput('LON').setVisible(global);
			this.getInput('X').setVisible(!global);
			this.getInput('Y').setVisible(!global);
			this.getInput('Z').fieldRow[0].setValue(frameId == 'GLOBAL' ? L('blk_altitude', 'altitude') : L('blk_z', 'z'));
		}
	}
	if (this.getInput('ID')) { // block has marker id field
		this.getInput('ID').setVisible(frameId == 'ARUCO'); // toggle id field
	}
	this.render();
}

function updateSetpointBlock(e) {
	if (!(e instanceof Blockly.Events.Change || e instanceof Blockly.Events.Create)) return;

	considerFrameId.apply(this, arguments);

	var type = this.getFieldValue('TYPE');
	var velocity = type == 'VELOCITY';
	var attitude = type == 'ATTITUDE' || type == 'RATES';

	this.getInput('VX').setVisible(velocity);
	this.getInput('VY').setVisible(velocity);
	this.getInput('VZ').setVisible(velocity);
	this.getInput('YAW').setVisible(attitude);
	this.getInput('ROLL').setVisible(attitude);
	this.getInput('PITCH').setVisible(attitude);
	this.getInput('THRUST').setVisible(attitude);
	this.getInput('RELATIVE_TO').setVisible(type != 'RATES');

	if (type == 'RATES') {
		this.getInput('ID').setVisible(false);
	}

	this.render();
}

Blockly.Blocks['navigate'] = {
	init: function () {
		let navFrameId = frameIdsWithTerrain.slice();
		navFrameId.push([L('blk_global_local', 'global'), 'GLOBAL_LOCAL'])
		navFrameId.push([L('blk_global_wgs_alt', 'global, WGS 84 alt.'), 'GLOBAL'])
		this.appendDummyInput()
			.appendField(L('blk_navigate_to_point', 'navigate to point'));
		this.appendValueInput("X")
			.setCheck("Number")
			.appendField(L('blk_forward', 'forward'));
		this.appendValueInput("Y")
			.setCheck("Number")
			.appendField(L('blk_left', 'left'));
		this.appendValueInput("LAT")
			.setCheck("Number")
			.appendField(L('blk_latitude', 'latitude'))
			.setVisible(false);
		this.appendValueInput("LON")
			.setCheck("Number")
			.appendField(L('blk_longitude', 'longitude'))
			.setVisible(false)
		this.appendValueInput("Z")
			.setCheck("Number")
			.appendField(L('blk_up', 'up'));
		this.appendDummyInput()
			.appendField(L('blk_relative_to', 'relative to'))
			.appendField(new Blockly.FieldDropdown(navFrameId), "FRAME_ID");
		this.appendValueInput("ID")
			.setCheck("Number")
			.appendField(L('blk_with_id', 'with ID'))
			.setVisible(false)
		this.appendValueInput("SPEED")
			.setCheck("Number")
			.appendField(L('blk_with_speed', 'with speed'));
		this.appendDummyInput()
			.appendField(L('blk_wait', 'wait'))
			.appendField(new Blockly.FieldCheckbox("TRUE"), "WAIT");
		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Navigate to the specified point, coordinates are in meters.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
		this.setOnChange(considerFrameId);
	}
};

Blockly.Blocks['set_velocity'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_set_velocity', 'set velocity'));
		this.appendValueInput("X")
			.setCheck("Number")
			.appendField(L('blk_forward', 'forward'));
		this.appendValueInput("Y")
			.setCheck("Number")
			.appendField(L('blk_left', 'left'));
		this.appendValueInput("Z")
			.setCheck("Number")
			.appendField(L('blk_up', 'up'));
		this.appendDummyInput()
			.appendField(L('blk_relative_to', 'relative to'))
			.appendField(new Blockly.FieldDropdown(frameIds), "FRAME_ID");
		this.appendValueInput("ID")
			.setCheck("Number")
			.appendField(L('blk_with_id', 'with ID'))
			.setVisible(false)
		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Set the drone velocity in meters per second (cancels navigation requests).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
		this.setOnChange(considerFrameId);
	}
};

Blockly.Blocks['setpoint'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_set', 'set'));
		this.appendDummyInput()
			.appendField(new Blockly.FieldDropdown([[L('blk_velocity', 'velocity'), "VELOCITY"], [L('blk_attitude', 'attitude'), "ATTITUDE"], [L('blk_angular_rates', 'angular rates'), "RATES"]]), "TYPE");
		this.appendValueInput("VX")
			.setCheck("Number")
			.appendField(L('blk_vx', 'vx'));
		this.appendValueInput("VY")
			.setCheck("Number")
			.appendField(L('blk_vy', 'vy'));
		this.appendValueInput("VZ")
			.setCheck("Number")
			.appendField(L('blk_vz', 'vz'));
		this.appendValueInput("ROLL")
			.setCheck("Number")
			.appendField(L('blk_roll', 'roll'))
			.setVisible(false);
		this.appendValueInput("PITCH")
			.setCheck("Number")
			.appendField(L('blk_pitch', 'pitch'))
			.setVisible(false);
		this.appendValueInput("YAW")
			.setCheck("Number")
			.appendField(L('blk_yaw', 'yaw'))
			.setVisible(false);
		this.appendValueInput("THRUST")
			.setCheck("Number")
			.appendField(L('blk_thrust', 'thrust'))
			.setVisible(false);
		this.appendDummyInput('RELATIVE_TO')
			.appendField(L('blk_relative_to', 'relative to'))
			.appendField(new Blockly.FieldDropdown(frameIds), "FRAME_ID");
		this.appendValueInput("ID")
			.setCheck("Number")
			.appendField(L('blk_with_id', 'with ID'))
			.setVisible(false);
		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Set the drone's setpoints of different types (cancels navigation requests).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
		this.setOnChange(updateSetpointBlock);
	}
};

Blockly.Blocks['rangefinder_distance'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_rangefinder_distance', 'current rangefinder distance'));
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['get_position'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_current', 'current'))
			.appendField(new Blockly.FieldDropdown([[L('blk_x', 'x'), "X"], [L('blk_y', 'y'), "Y"], [L('blk_z', 'z'), "Z"], [L('blk_vx', 'vx'), "VX"], [L('blk_vy', 'vy'), "VY"], [L('blk_vz', 'vz'), "VZ"]]), "FIELD")
			.appendField(L('blk_relative_to', 'relative to'))
			.appendField(new Blockly.FieldDropdown(frameIdsWithTerrain), "FRAME_ID");
		this.appendValueInput("ID")
			.setCheck("Number")
			.appendField(L('blk_with_id', 'with ID'))
			.setVisible(false)
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current position or velocity in meters or meters per second.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
		this.setOnChange(considerFrameId);
	}
};

Blockly.Blocks['get_yaw'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_current_yaw_relative_to', 'current yaw relative to'))
			.appendField(new Blockly.FieldDropdown(frameIds), "FRAME_ID");
		this.appendValueInput("ID")
			.setCheck("Number")
			.appendField(L('blk_with_id', 'with ID'))
			.setVisible(false)
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current yaw in degree (not radian).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
		this.setOnChange(considerFrameId);
	}
};

Blockly.Blocks['get_attitude'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_current', 'current'))
			.appendField(new Blockly.FieldDropdown([[L('blk_roll', 'roll'), "ROLL"], [L('blk_pitch', 'pitch'), "PITCH"], [L('blk_roll_rate', 'roll rate'), "ROLL_RATE"], [L('blk_pitch_rate', 'pitch rate'), "PITCH_RATE"], [L('blk_yaw_rate', 'yaw rate'), "YAW_RATE"]]), "FIELD");
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current orientation or angle rates in degree or degree per second (not radian).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['voltage'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_current', 'current'))
			.appendField(new Blockly.FieldDropdown([[L('blk_total', 'total'), "VOLTAGE"], [L('blk_cell', 'cell'), "CELL_VOLTAGE"]]), "TYPE")
			.appendField(L('blk_voltage', 'voltage'));
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current battery voltage in volts.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['get_rc'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_rc_channel', 'RC channel'))
		this.appendValueInput("CHANNEL")
			.setCheck("Number");
		this.setInputsInline(true);
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current RC channel value.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
}

Blockly.Blocks['armed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_armed_q', 'armed?'));
		this.setOutput(true, "Boolean");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns if the drone armed.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};


Blockly.Blocks['mode'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_current_flight_mode', 'current flight mode'));
		this.setOutput(true, "String");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current flight mode (POSCTL, OFFBOARD, etc).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};


Blockly.Blocks['wait_arrival'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_wait_arrival', 'wait arrival'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Wait until the drone arrives to the navigation target.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['get_time'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_time', 'time'));
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current timestamp in seconds.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['arrived'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_arrived_q', 'arrived?'));
		this.setOutput(true, "Boolean");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns if the drone arrived to the navigation target.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['set_led'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_set_led', 'set LED'));
		this.appendValueInput("INDEX")
			.setCheck("Number");
		this.appendValueInput("COLOR")
			.setCheck("Colour")
			.appendField(L('blk_to_color', 'to color'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_LED);
		this.setTooltip("Set an individual LED to specified color.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['set_effect'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_set_led_effect', 'set LED effect'))
			.appendField(new Blockly.FieldDropdown([[L('blk_fill', 'fill'), "FILL"], [L('blk_blink', 'blink'), "BLINK"], [L('blk_blink_fast', 'fast blink'), "BLINK_FAST"], [L('blk_fade', 'fade'), "FADE"], [L('blk_wipe', 'wipe'), "WIPE"], [L('blk_flash', 'flash'), "FLASH"], [L('blk_rainbow', 'rainbow'), "RAINBOW"], [L('blk_rainbow_fill', 'rainbow fill'), "RAINBOW_FILL"]]), "EFFECT");
		this.appendValueInput("COLOR")
			.setCheck("Colour")
			.appendField(L('blk_with_color', 'with color'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_LED);
		this.setTooltip("Set desired LED strip effect.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);

		this.setOnChange(function(e) {
			if (!(e instanceof Blockly.Events.Change || e instanceof Blockly.Events.Create)) return;

			// Hide color field on some effects
			var effect = this.getFieldValue('EFFECT');
			var hideColor = effect == 'RAINBOW' || effect == 'RAINBOW_FILL';
			this.inputList[1].setVisible(!hideColor);
			this.render();
		});
	}
};

Blockly.Blocks['led_count'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_led_count', 'LED count'));
		this.setOutput(true, "Number");
		this.setColour(COLOR_LED);
		this.setTooltip("Returns the number of LEDs (configured in led.launch).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['take_off'] = {
	init: function () {
		this.appendValueInput("ALT")
			.setCheck("Number")
			.appendField(L('blk_take_off_to', 'take off to'));
		this.appendDummyInput()
			.appendField(L('blk_wait', 'wait'))
			.appendField(new Blockly.FieldCheckbox("TRUE"), "WAIT");
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Take off on desired altitude in meters.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['land'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_land', 'land'));
		this.appendDummyInput()
			.appendField(L('blk_wait', 'wait'))
			.appendField(new Blockly.FieldCheckbox("TRUE"), "WAIT");
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Land the drone.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['global_position'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_current', 'current'))
			.appendField(new Blockly.FieldDropdown([[L('blk_latitude', 'latitude'), "LAT"], [L('blk_longitude', 'longitude'), "LON"], [L('blk_altitude', 'altitude'), "ALT"]]), "FIELD");
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns current global position (latitude, longitude, altitude above the WGS 84 ellipsoid).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['on_take_off'] = {
	init: function () {
		this.appendStatementInput("TAKE_OFF")
			.setCheck(null)
			.appendField(L('blk_when_took_off', 'When took off'));
		this.setColour(230);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['on_landing'] = {
	init: function () {
		this.appendStatementInput("LAND")
			.setCheck(null)
			.appendField(L('blk_when_landed', 'When landed'));
		this.setColour(230);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['on_armed'] = {
	init: function () {
		this.appendStatementInput("ARMED")
			.setCheck(null)
			.appendField(L('blk_when_armed', 'when armed'));
		this.setColour(230);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.FieldAngle.WRAP = 180;
Blockly.FieldAngle.ROUND = 10;

Blockly.Blocks['angle'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(new Blockly.FieldAngle(90), "ANGLE");
		this.setOutput(true, "Number");
		this.setColour(230);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['set_yaw'] = {
	init: function () {
		this.appendValueInput("YAW")
			.setCheck("Number")
			.appendField(L('blk_rotate_by', 'rotate by'));
		this.appendDummyInput()
			.appendField(L('blk_relative_to', 'relative to'))
			.appendField(new Blockly.FieldDropdown([[L('blk_body', 'body'), "body"], [L('blk_markers_map', 'markers map'), "aruco_map"], [L('blk_last_navigate_target', 'last navigate target'), "navigate_target"]]), "FRAME_ID");
		this.appendDummyInput()
			.appendField(L('blk_wait', 'wait'))
			.appendField(new Blockly.FieldCheckbox("TRUE"), "WAIT");
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("Rotate the drone to the specified angle in degree (not radian).");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['distance'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_distance_to_point', 'distance to point'));
		this.appendValueInput("X")
			.setCheck("Number")
			.appendField(L('blk_x', 'x'));
		this.appendValueInput("Y")
			.setCheck("Number")
			.appendField(L('blk_y', 'y'));
		this.appendValueInput("Z")
			.setCheck("Number")
			.appendField(L('blk_z', 'z'));
		this.appendDummyInput()
			.appendField(L('blk_relative_to', 'relative to'))
			.appendField(new Blockly.FieldDropdown([[L('blk_markers_map', 'markers map'), "ARUCO_MAP"], [L('blk_marker', 'marker'), "ARUCO"], [L('blk_last_navigate_target', 'last navigate target'), "NAVIGATE_TARGET"], [L('blk_terrain', 'terrain'), "TERRAIN"]]), "FRAME_ID");
		this.appendValueInput("ID")
			.setCheck("Number")
			.appendField(L('blk_with_id', 'with ID'))
			.setVisible(false);
		this.setInputsInline(false);
		this.setOutput(true, "Number");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns the distance to the given point in meters.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
		this.setOnChange(considerFrameId);
	}
};

Blockly.Blocks['wait'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_wait', 'wait'));
		this.appendValueInput("TIME")
			.setCheck("Number");
		this.appendDummyInput()
			.appendField(L('blk_seconds', 'seconds'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(COLOR_FLIGHT);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

var keys = [['up', 'UP'], ['down', 'DOWN'], ['left', 'LEFT'], ['right', 'RIGHT'], ['space', 'SPACE']];

Blockly.Blocks['key_pressed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_key', 'key'))
			.appendField(new Blockly.FieldDropdown(keys, "NAME"))
			.appendField(L('blk_pressed', 'pressed'));
		this.appendStatementInput("PRESSED")
			.setCheck(null);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip("");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};

Blockly.Blocks['gpio_read'] = {
	init: function () {
		this.appendValueInput("PIN")
			.setCheck("Number")
			.appendField(L('blk_read_gpio_pin', 'read GPIO pin'));
		this.setOutput(true, "Boolean");
		this.setColour(COLOR_GPIO);
		this.setTooltip("Returns if there is voltage on a GPIO pin.");
		this.setHelpUrl(DOCS_URL + '#GPIO');
	}
};

Blockly.Blocks['gpio_write'] = {
	init: function () {
		this.appendValueInput("PIN")
			.setCheck("Number")
			.appendField(L('blk_set_gpio_pin', 'set GPIO pin'));
		this.appendValueInput("LEVEL")
			.setCheck("Boolean")
			.appendField(L('blk_to', 'to'));
		this.setInputsInline(true);
		this.setColour(COLOR_GPIO);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setTooltip("Set GPIO pin level.");
		this.setHelpUrl(DOCS_URL + '#GPIO');
	}
};

Blockly.Blocks['set_servo'] = {
	init: function () {
		this.appendValueInput("PIN")
			.setCheck("Number")
			.appendField(L('blk_set_gpio_pin', 'set GPIO pin'));
		this.appendValueInput("PWM")
			.setCheck("Number")
			.appendField(L('blk_to_pwm', 'to PWM'));
		this.setInputsInline(true);
		this.setColour(COLOR_GPIO);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setTooltip("Set PWM on a GPIO pin to control servo. PWM is specified in range of 500–2500 μs.");
		this.setHelpUrl(DOCS_URL + '#GPIO');
	}
};

Blockly.Blocks['set_duty_cycle'] = {
	init: function () {
		this.appendValueInput("PIN")
			.setCheck("Number")
			.appendField(L('blk_set_gpio_pin', 'set GPIO pin'));
		this.appendValueInput("DUTY_CYCLE")
			.setCheck("Number")
			.appendField(L('blk_to_duty_cycle', 'to duty cycle'));
		this.setInputsInline(true);
		this.setColour(COLOR_GPIO);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setTooltip("Set PWM duty cycle on a GPIO pin (better to control LEDs, etc). Duty cycle is set in range of 0–1.");
		this.setHelpUrl(DOCS_URL + '#GPIO');
	}
};

// QR scan block
Blockly.Blocks['scan_qr'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(L('blk_scan_qr_data', 'scan QR data'));
		this.appendValueInput("TIMEOUT")
			.setCheck("Number")
			.appendField(L('blk_timeout_s', 'timeout, s'));
		this.setInputsInline(true);
		this.setOutput(true, "String");
		this.setColour(COLOR_STATE);
		this.setTooltip("Returns data from the first detected QR code within timeout.");
		this.setHelpUrl(DOCS_URL + '#' + this.type);
	}
};
