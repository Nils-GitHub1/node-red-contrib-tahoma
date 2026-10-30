"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
var continueWhenCompleted = function (configNode_1, execId_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([configNode_1, execId_1], args_1, true), void 0, function (configNode, execId, timeoutMs) {
        var deadline, isFinished;
        if (timeoutMs === void 0) { timeoutMs = 120000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deadline = Date.now() + timeoutMs;
                    _a.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 3];
                    return [4 /*yield*/, validateStatus(configNode, execId)];
                case 2:
                    isFinished = _a.sent();
                    if (isFinished) {
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for TaHoma command execution');
            }
        });
    });
};
var waitForStopped = function (somfyClient_1, device_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([somfyClient_1, device_1], args_1, true), void 0, function (somfyClient, device, timeoutMs) {
        var deadline, states, movingState, moving;
        var _a;
        if (timeoutMs === void 0) { timeoutMs = 30000; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    deadline = Date.now() + timeoutMs;
                    _b.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 4];
                    return [4 /*yield*/, somfyClient.getDeviceStates(device)];
                case 2:
                    states = _b.sent();
                    movingState = (_a = states.find(function (state) { return state.name.split(':').pop() === 'MovingState'; })) === null || _a === void 0 ? void 0 : _a.value;
                    moving = parseDeviceBoolean(movingState);
                    if (moving === false) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2500); })];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error('Timed out waiting for the blind to stop moving');
            }
        });
    });
};
var waitForMyPosition = function (somfyClient_1, device_1, targetPosition_1, targetOrientation_1) {
    var args_1 = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        args_1[_i - 4] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([somfyClient_1, device_1, targetPosition_1, targetOrientation_1], args_1, true), void 0, function (somfyClient, device, targetPosition, targetOrientation, timeoutMs) {
        var deadline, _loop_1, state_1;
        if (timeoutMs === void 0) { timeoutMs = 120000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deadline = Date.now() + timeoutMs;
                    _loop_1 = function () {
                        var states, getValue, position, orientationValue, positionMatches, orientationMatches, movingValue, moving;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, somfyClient.getDeviceStates(device)];
                                case 1:
                                    states = _b.sent();
                                    getValue = function (name) {
                                        var _a;
                                        return (_a = states.find(function (state) { return state.name.split(':').pop() === name; })) === null || _a === void 0 ? void 0 : _a.value;
                                    };
                                    position = Number(getValue('ClosureState'));
                                    orientationValue = getValue('SlateOrientationState');
                                    positionMatches = Number.isFinite(position) &&
                                        Math.abs(position - targetPosition) <= 1;
                                    orientationMatches = targetOrientation === undefined ||
                                        (orientationValue !== undefined &&
                                            orientationValue !== null &&
                                            Number.isFinite(Number(orientationValue)) &&
                                            Math.abs(Number(orientationValue) - targetOrientation) <= 1);
                                    movingValue = getValue('MovingState');
                                    moving = parseDeviceBoolean(movingValue) === false;
                                    if (positionMatches && orientationMatches && moving) {
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2500); })];
                                case 2:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for the blind to reach its My position');
            }
        });
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
function getStateValue(states, name) {
    var _a;
    return (_a = states.find(function (state) { return state.name.split(':').pop() === name; })) === null || _a === void 0 ? void 0 : _a.value;
}
function parseDeviceBoolean(value) {
    if (value === undefined || value === null) {
        return undefined;
    }
    switch (String(value).toLowerCase()) {
        case 'true':
        case '1':
        case 'on':
        case 'yes':
            return true;
        case 'false':
        case '0':
        case 'off':
        case 'no':
            return false;
        default:
            return undefined;
    }
}
function stateMatches(actual, expected) {
    if (typeof expected === 'boolean') {
        return parseDeviceBoolean(actual) === expected;
    }
    if (actual === undefined || actual === null) {
        return false;
    }
    var actualNumber = Number(actual);
    var expectedNumber = Number(expected);
    if (!Number.isFinite(actualNumber) ||
        !Number.isFinite(expectedNumber)) {
        return false;
    }
    return Math.abs(actualNumber - expectedNumber) <= 1;
}
function wait(milliseconds) {
    return new Promise(function (resolve) { return setTimeout(resolve, milliseconds); });
}
function waitForExpectedDeviceState(somfyApiClient_1, device_1, expected_1) {
    return __awaiter(this, arguments, void 0, function (somfyApiClient, device, expected, timeoutMs) {
        var deadline, _loop_2, state_2;
        if (timeoutMs === void 0) { timeoutMs = 120000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deadline = Date.now() + timeoutMs;
                    _loop_2 = function () {
                        var states, checks, matches;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, somfyApiClient.getDeviceStates(device)];
                                case 1:
                                    states = _b.sent();
                                    checks = [];
                                    if (expected.position !== undefined) {
                                        checks.push(['ClosureState', expected.position]);
                                    }
                                    if (expected.orientation !== undefined) {
                                        checks.push(['SlateOrientationState', expected.orientation]);
                                    }
                                    if (expected.movingState !== undefined) {
                                        checks.push(['MovingState', expected.movingState]);
                                    }
                                    matches = checks.every(function (_a) {
                                        var name = _a[0], value = _a[1];
                                        return stateMatches(getStateValue(states, name), value);
                                    });
                                    if (checks.length > 0 && matches) {
                                        return [2 /*return*/, { value: void 0 }];
                                    }
                                    return [4 /*yield*/, wait(2500)];
                                case 2:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_2()];
                case 2:
                    state_2 = _a.sent();
                    if (typeof state_2 === "object")
                        return [2 /*return*/, state_2.value];
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for the expected TaHoma device state');
            }
        });
    });
}
function generateInstructionsFromPayload(payload) {
    switch (payload.action) {
        case 'open':
            return {
                command: TahomaCommands.OPEN,
                expectedState: { position: 0 },
                labels: {
                    done: 'Open',
                    progress: 'Opening...',
                },
            };
        case 'close':
            return {
                command: TahomaCommands.CLOSE,
                expectedState: { position: 100 },
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
                expectedState: {
                    movingState: false,
                },
                labels: {
                    done: 'Stopped',
                    progress: 'Stopping...',
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
                // expectedState: { repetitions: parseInt(payload.repetitions, 10) },
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
        this.on('input', function (msg) { return __awaiter(_this, void 0, void 0, function () {
            var instructions, command, targetPosition, configNode, somfyApiClient, myTargetPosition, myTargetOrientation, states_1, getValue, positionValue, position, orientation_1, commandExecutionResponse, error_1, message;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 11, , 12]);
                        instructions = generateInstructionsFromPayload(msg.payload);
                        if (instructions === null) {
                            return [2 /*return*/];
                        }
                        command = {
                            name: instructions.command,
                            parameters: instructions.parameters || [],
                        };
                        if (msg.payload.lowspeed && instructions.command !== 'stop' && typeof ((_a = instructions.expectedState) === null || _a === void 0 ? void 0 : _a.position) === 'number') {
                            targetPosition = instructions.expectedState.position || 0;
                            command.name = 'position_low_speed';
                            command.parameters = [targetPosition];
                        }
                        this.status({
                            fill: 'yellow',
                            shape: 'dot',
                            text: instructions.labels.progress,
                        });
                        configNode = RED.nodes.getNode(this['tahomabox']);
                        if (!configNode) {
                            throw new Error('TaHoma configuration node not found');
                        }
                        somfyApiClient = new somfy_api_1.SomfyApi(configNode);
                        myTargetPosition = void 0;
                        myTargetOrientation = void 0;
                        if (!(instructions.command === TahomaCommands.MY)) return [3 /*break*/, 2];
                        return [4 /*yield*/, somfyApiClient.getDeviceStates(this['device'])];
                    case 1:
                        states_1 = _b.sent();
                        getValue = function (name) {
                            var _a;
                            return (_a = states_1.find(function (state) { return state.name.split(':').pop() === name; })) === null || _a === void 0 ? void 0 : _a.value;
                        };
                        positionValue = getValue('Memorized1PositionState');
                        position = Number(positionValue);
                        if (positionValue === undefined ||
                            positionValue === null ||
                            !Number.isFinite(position)) {
                            throw new Error('Memorized1PositionState is unavailable');
                        }
                        myTargetPosition = position;
                        orientation_1 = getValue('Memorized1OrientationState');
                        if (orientation_1 !== undefined &&
                            orientation_1 !== null &&
                            Number.isFinite(Number(orientation_1))) {
                            myTargetOrientation = Number(orientation_1);
                        }
                        instructions.expectedState = __assign({ position: myTargetPosition }, (myTargetOrientation !== undefined
                            ? { orientation: myTargetOrientation }
                            : {}));
                        _b.label = 2;
                    case 2: return [4 /*yield*/, somfyApiClient.execute(this['device'], command)];
                    case 3:
                        commandExecutionResponse = _b.sent();
                        if (!instructions.expectedState) return [3 /*break*/, 10];
                        return [4 /*yield*/, continueWhenCompleted(configNode, commandExecutionResponse.execId)];
                    case 4:
                        _b.sent();
                        if (!(instructions.command === TahomaCommands.MY)) return [3 /*break*/, 6];
                        if (myTargetPosition === undefined) {
                            throw new Error('My target position is unavailable');
                        }
                        return [4 /*yield*/, waitForMyPosition(somfyApiClient, this['device'], myTargetPosition, myTargetOrientation)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 6:
                        if (!(instructions.command === TahomaCommands.STOP)) return [3 /*break*/, 8];
                        return [4 /*yield*/, waitForStopped(somfyApiClient, this['device'])];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, waitForExpectedDeviceState(somfyApiClient, this['device'], instructions.expectedState)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        this.status({
                            fill: 'green',
                            shape: 'dot',
                            text: instructions.labels.done,
                        });
                        this.send(msg);
                        return [3 /*break*/, 12];
                    case 11:
                        error_1 = _b.sent();
                        message = error_1 instanceof Error ? error_1.message : String(error_1);
                        this.status({
                            fill: 'red',
                            shape: 'ring',
                            text: 'TaHoma not reachable',
                        });
                        this.error("TaHoma error: ".concat(message), msg);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        }); });
    });
};
