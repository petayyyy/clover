/*
 * Copyright (C) 2020 Copter Express Technologies
 *
 * Author: Oleg Kalachev <okalachev@gmail.com>
 *
 * Distributed under MIT License (available at https://opensource.org/licenses/MIT).
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

import * as ros from './ros.js';
import './blocks.js';
import {generateCode, generateUserCode} from './python.js';

// Function to get image topics from ROS
async function getImageTopicsFromROS() {
    try {
        if (window.ros && window.ros.ros && window.ros.ros.isConnected) {
            console.log('Fetching image topics from ROS...');
            
            // Get all topics from ROS with timeout
            const topics = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout while fetching topics'));
                }, 5000); // 5 second timeout
                
                window.ros.ros.getTopics((topics) => {
                    clearTimeout(timeout);
                    resolve(topics);
                }, (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            
            console.log('Received topics from ROS:', topics);
            
            // Filter topics that have Image type
            const imageTopics = [];
            for (const topicName in topics) {
                const topicType = topics[topicName];
                if (topicType === 'sensor_msgs/Image' || topicType === 'sensor_msgs/CompressedImage') {
                    // Create a friendly name for the topic
                    let friendlyName = topicName;
                    
                    // Remove leading slash if present
                    const cleanTopicName = topicName.startsWith('/') ? topicName.substring(1) : topicName;
                    
                    // Create more descriptive friendly names
                    if (cleanTopicName.includes('main_camera/image_raw')) {
                        friendlyName = 'main camera (raw)';
                    } else if (cleanTopicName.includes('main_camera/image_raw_throttled')) {
                        friendlyName = 'main camera (throttled)';
                    } else if (cleanTopicName.includes('optical_flow/debug')) {
                        friendlyName = 'optical flow (debug)';
                    } else if (cleanTopicName.includes('optical_flow/image')) {
                        friendlyName = 'optical flow (image)';
                    } else if (cleanTopicName.includes('aruco_detect/debug')) {
                        friendlyName = 'aruco detect (debug)';
                    } else if (cleanTopicName.includes('aruco_map/debug')) {
                        friendlyName = 'aruco map (debug)';
                    } else if (cleanTopicName.includes('aruco_map/image')) {
                        friendlyName = 'aruco map (image)';
                    } else if (cleanTopicName.includes('aruco')) {
                        friendlyName = 'aruco';
                    } else if (cleanTopicName.includes('camera')) {
                        friendlyName = 'camera';
                    } else if (cleanTopicName.includes('image')) {
                        friendlyName = 'image';
                    } else {
                        // Use the last part of the topic name as friendly name
                        const parts = cleanTopicName.split('/');
                        friendlyName = parts[parts.length - 1].replace(/_/g, ' ');
                    }
                    
                    imageTopics.push([friendlyName, topicName]);
                }
            }
            
            // Sort topics alphabetically by friendly name
            imageTopics.sort((a, b) => a[0].localeCompare(b[0]));
            
            console.log('Found image topics:', imageTopics);
            
            // If no image topics found, return default topics
            if (imageTopics.length === 0) {
                console.log('No image topics found, using defaults');
                return [
                    ['main camera', 'main_camera/image_raw'],
                    ['optical flow', 'optical_flow/image_raw'],
                    ['aruco', 'aruco/image_raw']
                ];
            }
            
            return imageTopics;
        } else {
            console.log('ROS not connected, using default topics');
        }
    } catch (e) {
        console.warn('Could not fetch image topics from ROS:', e);
    }
    
    // Return default topics if ROS is not available or error occurred
    return [
        ['main camera', 'main_camera/image_raw'],
        ['optical flow', 'optical_flow/image_raw'],
        ['aruco', 'aruco/image_raw']
    ];
}

// Make function available globally for blocks.js
window.getImageTopicsFromROS = getImageTopicsFromROS;

// Update image topics when ROS connects
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        console.log('Page loaded, starting topic update process...');
        
        // Try to update topics immediately
        try {
            if (window.updateImageTopics) {
                await window.updateImageTopics();
                console.log('Topics updated successfully');
            }
        } catch (e) {
            console.warn('Initial topic update failed:', e);
        }
        
        // Also try after a delay to catch ROS connection
        setTimeout(async () => {
            try {
                if (window.updateImageTopics) {
                    await window.updateImageTopics();
                    console.log('Delayed topic update completed');
                }
            } catch (e) {
                console.warn('Delayed topic update failed:', e);
            }
        }, 3000); // Wait 3 seconds for ROS to connect
        
        // Try again after longer delay
        setTimeout(async () => {
            try {
                if (window.updateImageTopics) {
                    await window.updateImageTopics();
                    console.log('Final topic update completed');
                }
            } catch (e) {
                console.warn('Final topic update failed:', e);
            }
        }, 8000); // Wait 8 seconds for full ROS initialization
    });
}

// Initialize i18n system
async function initializeI18n() {
    try {
        // Wait a bit to ensure DOM is fully loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await window.i18n.init();
        
        // Set up language selector event listener
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.value = window.i18n.getCurrentLanguage();
            languageSelector.addEventListener('change', function(e) {
                window.i18n.setLanguage(e.target.value);
                // Force full page reload to reinitialize all resources for the new language
                location.reload();
            });
        }
        
        // Update interface with current language
        if (window.i18n.isInitialized()) {
            window.i18n.updateInterface();
        }

        // Reveal the page only after i18n applied
        document.body.style.visibility = 'visible';
        
        console.log('I18n system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize i18n system:', error);
        // In case of failure, ensure page is visible
        document.body.style.visibility = 'visible';
    }
}

// Initialize i18n when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeI18n);
} else {
    // DOM is already loaded
    initializeI18n();
}

// Tabs
document.getElementById('tabs').addEventListener('click', function(e) {
	var tab = e.target.getAttribute('data-tab');
	if (tab) {
		for (let elem of e.target.parentElement.querySelectorAll('[data-tab]')) {
			elem.classList.remove('selected');
		}
		e.target.classList.add('selected');
		document.body.setAttribute('data-tab', tab);
	}
});

window.workspace = Blockly.inject('blockly', {
	toolbox: document.getElementById('toolbox'),
	grid: {
		spacing: 25,
		length: 3,
		colour: '#ccc',
		snap: true
	},
	zoom: { controls: true, wheel: true },
	media: 'blockly/media/',
});

function readParams() {
	return Promise.all([
		ros.readParam('navigate_tolerance', true, 0.2),
		ros.readParam('navigate_global_tolerance', true, 1),
		ros.readParam('yaw_tolerance', true, 1),
		ros.readParam('sleep_time', true, 0.2),
		ros.readParam('confirm_run', true, true),
	]);
}

var ready = readParams(); // initialization complete promise

var pythonArea = document.getElementById('python');

// update Python code
window.workspace.addChangeListener(function(e) {
	ready.then(function() {
		pythonArea.innerHTML = generateUserCode(window.workspace);
		hljs.highlightBlock(pythonArea);
	});
});

var running = false;
var runRequest = false;

new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'block', messageType: 'std_msgs/String' }).subscribe(function(msg) {
	window.workspace.highlightBlock(msg.data);
	runRequest = false;
	update();
});

new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'running' }).subscribe(function(msg) {
	running = msg.data;
	runRequest = false;
	if (!running) {
		window.workspace.highlightBlock('');
	}
	update();
});

var notifElem = document.getElementById('notifications');

function z(n) { return (n < 10 ? '0' : '') + n; } // add leading zero

new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'print', messageType: 'std_msgs/String'}).subscribe(function(msg) {
	var d = new Date(); // TODO: use rosgraph_msgs/Log?
	var timestamp = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
	notifElem.innerHTML += `${timestamp}: ${msg.data}\n`;
	notifElem.scrollTop = notifElem.scrollHeight;
});

new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'error', messageType: 'std_msgs/String'}).subscribe(function(msg) {
			window.i18n.alert(window.i18n.t('error_prefix') + msg.data);
});

var runButton = document.getElementById('run');

function update() {
	document.body.classList.toggle('running', running);
	runButton.disabled = !ros.ros.isConnected || runRequest || running;
}

var shownPrompts = new Set();

new ROSLIB.Topic({ ros: ros.ros, name: ros.priv + 'prompt', messageType: 'clover_blocks/Prompt'}).subscribe(function(msg) {
	if (shownPrompts.has(msg.id)) return;
	shownPrompts.add(msg.id);

	window.i18n.prompt(msg.message).then(function(response){
		new ROSLIB.Topic({
			ros: ros.ros,
			name: ros.priv + 'input/' + msg.id,
			messageType: 'std_msgs/String',
			latch: true
		}).publish(new ROSLIB.Message({ data: response || '' }));
	});
});

window.stopProgram = function() {
	ros.stopService.callService(new ROSLIB.ServiceRequest(), function(res) {
		if (!res.success) window.i18n.alert(res.message);
	}, err => window.i18n.alert(err))
}

ros.ros.on('connection', update);

ros.ros.on('close', update);

ready.then(() => runButton.disabled = false);

window.runProgram = async function() {
	if (ros.params.confirm_run) {
		const ok = await window.i18n.confirm(window.i18n.t('run_program_confirm'));
		if (!ok) return;
	}

	runRequest = true;
	update();
	var code = generateCode(window.workspace);
	console.log(code);
	ros.runService.callService(new ROSLIB.ServiceRequest({ code: code } ), function(res) {
		if (!res.success) {
			runRequest = false;
			update();
			window.i18n.alert(res.message);
		}
	}, function(err) {
		runRequest = false;
		update();
		window.i18n.alert(err);
	})
}

window.land = function() {
	window.stopProgram();
	ros.landService.callService(new ROSLIB.ServiceRequest(), function(result) {
	}, function(err) {
		window.i18n.alert(window.i18n.t('unable_to_land') + err);
	});
}

function getProgramXml() {
	var xmlDom = Blockly.Xml.workspaceToDom(window.workspace);
	return Blockly.Xml.domToPrettyText(xmlDom);
}

function setProgramXml(xml) {
	window.workspace.clear();
	if (xml) {
		let xmlDom = Blockly.Xml.textToDom(xml);
		Blockly.Xml.domToWorkspace(xmlDom, window.workspace);
	}
}

window.workspace.addChangeListener(function(e) {
	localStorage.setItem('xml', getProgramXml());
});

var programSelect = document.querySelector('#program-name');
var userPrograms = programSelect.querySelector('optgroup[data-type=user]');
var examplePrograms = programSelect.querySelector('optgroup[data-type=example]');

var programs = {};
var program = '';

function loadWorkspace() {
	var xml = localStorage.getItem('xml');
	if (xml) {
		setProgramXml(xml);
	}
	program = localStorage.getItem('program') || '';
}

loadWorkspace();

function loadPrograms() {
	ros.loadService.callService(new ROSLIB.ServiceRequest(), function(res) {
		if (!res.success) window.i18n.alert(res.message);

		for (let i = 0; i < res.names.length; i++) {
			let name = res.names[i];
			let program = res.programs[i];
			let option = document.createElement('option');
			option.innerHTML = res.names[i];
			if (name.startsWith('examples/')) {
				examplePrograms.appendChild(option);
			} else {
				userPrograms.appendChild(option);
			}

			programs[name] = program;
		}

		if (program) {
			programSelect.value = program;
		}
		updateChanged();
	}, function(err) {
		document.querySelector('.backend-fail').style.display = 'inline';
		window.i18n.alert(window.i18n.t('error_loading_programs'));
		runButton.disabled = true;
	})
}

loadPrograms();

function getProgramName() {
	if (programSelect.value.startsWith('@')) {
		return ''
	}
	return programSelect.value;
}

function updateChanged() {
	var name = program;
	document.body.classList.toggle('changed', name in programs && (programs[name].trim() != getProgramXml().trim()));
}

window.workspace.addChangeListener(function(e) {
	if (e instanceof Blockly.Events.Change || e instanceof Blockly.Events.Create || e instanceof Blockly.Events.Delete) {
		updateChanged();
	}
});

function saveProgram() {
	var name = getProgramName();

	if (!name) {
		name = prompt(window.i18n.t('enter_program_name'));
		// keeping sync prompt for now to avoid larger refactor; fallback to native
	}

	let xml = getProgramXml();
	ros.storeService.callService(new ROSLIB.ServiceRequest({
		name: name,
		program: xml
	}), function(result) {
		if (!result.success) {
			alert(result.message);
			return;
		}
		console.log(result.message);
		programSelect.blur();
		program = name;
		localStorage.setItem('program', name);
		programs[name] = xml;
		programSelect.value = program;
		updateChanged();
	}, function(err) {
		// TODO: restore previous state correctly
		alert(window.i18n.t('unable_to_store') + err);
		programSelect.blur();
		programSelect.value = program;
	});
}

window.addEventListener('keydown', function(e) {
	if ((e.metaKey || e.ctrlKey) && e.key == 's') { // ctrl+s/cmd+s
		e.preventDefault();
		if (!document.body.classList.contains('changed')) { // if not changed, ignore
			return;
		}
		saveProgram();
	}
});

programSelect.addEventListener('change', async function(e) {
	if (programSelect.value == '@clear') {
		const ok = await window.i18n.confirm(window.i18n.t('clear_workspace_confirm'));
		if (!ok) {
			programSelect.value = program;
			return;
		}
		localStorage.removeItem('program');
		program = '';
		setProgramXml('');
		programSelect.value = program;
		programSelect.blur();
	} else if (programSelect.value == '@save') {
		saveProgram();
	} else {
		// load program
		if (program == '' || document.body.classList.contains('changed')) {
			const ok = await window.i18n.confirm(window.i18n.t('discard_changes_confirm'));
			if (!ok) {
				programSelect.value = program;
				return;
			}
		}
		let name = programSelect.value;
		let lastProgram = getProgramXml();
		programSelect.blur();
		try {
			setProgramXml(programs[name]);
			program = name;
			localStorage.setItem('program', name);
		} catch(e) {
			window.i18n.alert(e);
			setProgramXml(lastProgram);
			program = ''
			programSelect.value = program;
		}
		updateChanged();
	}
});
