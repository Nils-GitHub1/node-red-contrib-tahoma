"use strict";
var somfy_api_1 = require("../core/somfy-api");
// ROTATION command: 'setOrientation' works on local API. 'rotation' seems to be legacy command not anymore used ? Modifier to avoid issues with local API according to marekhalmo as mentioned in issue #62 on nikkow/node-red-contrib-tahoma 
var TahomaCommands;
(function (TahomaCommands) {
    TahomaCommands["OPEN"] = "open";
    TahomaCommands["CLOSE"] = "close";
    TahomaCommands["ROTATION"] = "setOrientation";
    TahomaCommands["STOP"] = "stop";
    TahomaCommands["MY"] = "my";
    TahomaCommands["SET_CLOSURE"] = "setClosure";
    TahomaCommands["SET_CLOSURE_AND_ORIENTATION"] = "setClosureAndOrientation";
    TahomaCommands["ON"] = "on";
    TahomaCommands["OFF"] = "off";
    TahomaCommands["SET_INTENSITY"] = "setIntensity";
    TahomaCommands["SET_ONOFF"] = "setOnOff";
    TahomaCommands["TOGGLE"] = "toggle";
    TahomaCommands["WINK"] = "wink";
})(TahomaCommands || (TahomaCommands = {}));
var STATE_VALIDATOR_POLLING_DELAY = 2500; // Check every 2.5 seconds, until expected state is reached.
var validateStatus = function (configNode, execId) {
    return new Promise(function (resolve, reject) {
        return setTimeout(function () {
            var somfyClient = new somfy_api_1.SomfyApi(configNode);
            somfyClient
                .getStatusForExecutionId(execId)
                .then(function (status) {
                resolve(status === null);
            })
                .catch(reject);
        }, STATE_VALIDATOR_POLLING_DELAY);
    });
};
var continueWhenCompleted = function (configNode, execId) {
    return validateStatus(configNode, execId).then(function (isFinished) {
        if (!isFinished) {
            return continueWhenCompleted(configNode, execId);
        }
    });
};
function getBoolean(value) {
    switch (String(value).toLowerCase()) {
        case 'true':
        case '1':
        case 'on':
        case 'yes':
            return true;
    }
    return false;
}
function generateInstructionsFromPayload(payload) {
    switch (payload.action) {
        case 'open':
            return {
                command: TahomaCommands.OPEN,
                expectedState: { open: true, position: 0 },
                labels: {
                    done: 'Open',
                    progress: 'Opening...',
                },
            };
        case 'close':
            return {
                command: TahomaCommands.CLOSE,
                expectedState: { open: false, position: 100 },
                labels: {
                    done: 'Closed',
                    progress: 'Closing...',
                },
            };
        case 'customPosition':
            return {
                command: TahomaCommands.SET_CLOSURE,
                expectedState: {
                    open: true,
                    position: parseInt(payload.position, 10),
                },
                labels: {
                    done: "Set to ".concat(payload.position),
                    progress: "Setting to ".concat(payload.position),
                },
                parameters: [parseInt(payload.position, 10)],
            };
        case 'customRotation':
        case 'customOrientation':
            return {
                command: TahomaCommands.ROTATION,
                expectedState: { orientation: parseInt(payload.orientation, 10) },
                labels: {
                    done: "Rotated to ".concat(payload.orientation),
                    progress: "Rotating to ".concat(payload.orientation, "..."),
                },
                parameters: [parseInt(payload.orientation, 10)],
            };
        case 'customClosureAndOrientation':
            return {
                command: TahomaCommands.SET_CLOSURE_AND_ORIENTATION,
                expectedState: {
                    position: parseInt(payload.position, 10),
                    orientation: parseInt(payload.orientation, 10)
                },
                labels: {
                    done: "Set to position:".concat(payload.position, ", orientation:").concat(payload.orientation),
                    progress: "Moving to position:".concat(payload.position, ", orientation:").concat(payload.orientation, "..."),
                },
                parameters: [
                    parseInt(payload.position, 10),
                    parseInt(payload.orientation, 10),
                ],
            };
        case 'stop':
            return {
                command: TahomaCommands.STOP,
                labels: {
                    done: "Stopped",
                    progress: "Stopping...",
                },
            };
        case 'my':
            return {
                command: TahomaCommands.MY,
                labels: {
                    done: 'My position',
                    progress: 'Moving to My position...',
                },
            };
        case 'on':
            return {
                command: TahomaCommands.ON,
                labels: {
                    done: "On",
                    progress: "Turning on...",
                },
                // expectedState: { onOff: "on"},
            };
        case 'off':
            return {
                command: TahomaCommands.OFF,
                labels: {
                    done: "Off",
                    progress: "Turning off...",
                },
                // expectedState: { onOff: "off"},
            };
        case 'toggle':
            return {
                command: TahomaCommands.TOGGLE,
                labels: {
                    done: "Toggled",
                    progress: "Toggling state ...",
                },
                // expectedState: { onOff: "off"},
            };
        case 'setOnOff':
            return {
                command: TahomaCommands.SET_ONOFF,
                labels: {
                    done: "".concat(payload.onOff),
                    progress: "Turning ".concat(payload.onOff, "..."),
                },
                // expectedState: { onOff: "off"},
                parameters: [+getBoolean(payload.onOff)],
            };
        case 'setIntensity':
            return {
                command: TahomaCommands.SET_INTENSITY,
                labels: {
                    done: "Set intensity to ".concat(payload.intensity),
                    progress: "Setting intensity to ".concat(payload.intensity),
                },
                // expectedState: { intensity: payload.intensity},
                parameters: [payload.intensity],
            };
        case 'wink':
            return {
                command: TahomaCommands.WINK,
                expectedState: { repetitions: parseInt(payload.repetitions, 10) },
                labels: {
                    done: "Stopped",
                    progress: "Winking ".concat(payload.repetitions, " time(s)"),
                },
                parameters: [parseInt(payload.repetitions, 10)],
            };
        default:
            return null;
    }
}
module.exports = function (RED) {
    RED.nodes.registerType('tahoma', function (props) {
        var _this = this;
        RED.nodes.createNode(this, props);
        this['device'] = props.device;
        this['tahomabox'] = props.tahomabox;
        this['name'] = props.name;
        this.on('input', function (msg) {
            var _a;
            var instructions = generateInstructionsFromPayload(msg.payload);
            if (instructions === null) {
                return;
            }
            var command = {
                name: instructions.command,
                parameters: instructions.parameters || [],
            };
            if (msg.payload.lowspeed && instructions.command !== 'stop' && typeof ((_a = instructions.expectedState) === null || _a === void 0 ? void 0 : _a.position) === 'number') {
                var targetPosition = instructions.expectedState.position || 0;
                command.name = 'position_low_speed';
                command.parameters = [targetPosition];
            }
            _this.status({
                fill: 'yellow',
                shape: 'dot',
                text: instructions.labels.progress,
            });
            var configNode = RED.nodes.getNode(_this['tahomabox']);
            var somfyApiClient = new somfy_api_1.SomfyApi(configNode);
            somfyApiClient
                .execute(_this['device'], command)
                .then(function (commandExecutionResponse) {
                if (!instructions.expectedState) {
                    _this.status({ fill: 'grey', shape: 'dot', text: 'Unknown' });
                    _this.send(msg);
                    return;
                }
                var execId = commandExecutionResponse.execId;
                return continueWhenCompleted(configNode, execId).then(function () {
                    _this.status({
                        fill: 'green',
                        shape: 'dot',
                        text: instructions.labels.done,
                    });
                    _this.send(msg);
                });
            })
                .catch(function (error) {
                var message = error instanceof Error ? error.message : String(error);
                _this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'TaHoma not reachable',
                });
                _this.error("TaHoma error: ".concat(message), msg);
            });
        });
    });
};
