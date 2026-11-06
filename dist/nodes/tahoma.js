"use strict";
const somfy_api_1 = require("../core/somfy-api");
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
const STATE_VALIDATOR_POLLING_DELAY = 2500; // Check every 2.5 seconds, until expected state is reached.
const validateStatus = (configNode, execId) => new Promise((resolve, reject) => setTimeout(() => {
    const somfyClient = new somfy_api_1.SomfyApi(configNode);
    somfyClient
        .getStatusForExecutionId(execId)
        .then((status) => {
        resolve(status === null);
    })
        .catch(reject);
}, STATE_VALIDATOR_POLLING_DELAY));
const continueWhenCompleted = async (configNode, execId, timeoutMs = 120000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const isFinished = await validateStatus(configNode, execId);
        if (isFinished) {
            return;
        }
    }
    throw new Error('Timed out waiting for TaHoma command execution');
};
const waitForStopped = async (somfyClient, device, timeoutMs = 30000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const states = await somfyClient.getDeviceStates(device);
        const movingState = states.find((state) => state.name.split(':').pop() === 'MovingState')?.value;
        const moving = parseDeviceBoolean(movingState);
        if (moving === false) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    throw new Error('Timed out waiting for the blind to stop moving');
};
const waitForMyPosition = async (somfyClient, device, targetPosition, targetOrientation, timeoutMs = 120000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const states = await somfyClient.getDeviceStates(device);
        const getValue = (name) => states.find((state) => state.name.split(':').pop() === name)?.value;
        const position = Number(getValue('ClosureState'));
        const orientationValue = getValue('SlateOrientationState');
        const positionMatches = Number.isFinite(position) && Math.abs(position - targetPosition) <= 1;
        const orientationMatches = targetOrientation === undefined ||
            (orientationValue !== undefined &&
                orientationValue !== null &&
                Number.isFinite(Number(orientationValue)) &&
                Math.abs(Number(orientationValue) - targetOrientation) <= 1);
        const movingValue = getValue('MovingState');
        const moving = parseDeviceBoolean(movingValue) === false;
        if (positionMatches && orientationMatches && moving) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    throw new Error('Timed out waiting for the blind to reach its My position');
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
    return states.find((state) => state.name.split(':').pop() === name)?.value;
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
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) {
        return false;
    }
    return Math.abs(actualNumber - expectedNumber) <= 1;
}
function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
async function waitForExpectedDeviceState(somfyApiClient, device, expected, timeoutMs = 120000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const states = await somfyApiClient.getDeviceStates(device);
        const checks = [];
        if (expected.position !== undefined) {
            checks.push(['ClosureState', expected.position]);
        }
        if (expected.orientation !== undefined) {
            checks.push(['SlateOrientationState', expected.orientation]);
        }
        if (expected.movingState !== undefined) {
            checks.push(['MovingState', expected.movingState]);
        }
        const matches = checks.every(([name, value]) => stateMatches(getStateValue(states, name), value));
        if (checks.length > 0 && matches) {
            return;
        }
        await wait(2500);
    }
    throw new Error('Timed out waiting for the expected TaHoma device state');
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
                    done: `Set to ${payload.position}`,
                    progress: `Setting to ${payload.position}`,
                },
                parameters: [parseInt(payload.position, 10)],
            };
        case 'customRotation':
        case 'customOrientation':
            return {
                command: TahomaCommands.ROTATION,
                expectedState: { orientation: parseInt(payload.orientation, 10) },
                labels: {
                    done: `Rotated to ${payload.orientation}`,
                    progress: `Rotating to ${payload.orientation}...`,
                },
                parameters: [parseInt(payload.orientation, 10)],
            };
        case 'customClosureAndOrientation':
            return {
                command: TahomaCommands.SET_CLOSURE_AND_ORIENTATION,
                expectedState: {
                    position: parseInt(payload.position, 10),
                    orientation: parseInt(payload.orientation, 10),
                },
                labels: {
                    done: `Set to position:${payload.position}, orientation:${payload.orientation}`,
                    progress: `Moving to position:${payload.position}, orientation:${payload.orientation}...`,
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
                    done: `On`,
                    progress: `Turning on...`,
                },
                // expectedState: { onOff: "on"},
            };
        case 'off':
            return {
                command: TahomaCommands.OFF,
                labels: {
                    done: `Off`,
                    progress: `Turning off...`,
                },
                // expectedState: { onOff: "off"},
            };
        case 'toggle':
            return {
                command: TahomaCommands.TOGGLE,
                labels: {
                    done: `Toggled`,
                    progress: `Toggling state ...`,
                },
                // expectedState: { onOff: "off"},
            };
        case 'setOnOff':
            return {
                command: TahomaCommands.SET_ONOFF,
                labels: {
                    done: `${payload.onOff}`,
                    progress: `Turning ${payload.onOff}...`,
                },
                // expectedState: { onOff: "off"},
                parameters: [+getBoolean(payload.onOff)],
            };
        case 'setIntensity':
            return {
                command: TahomaCommands.SET_INTENSITY,
                labels: {
                    done: `Set intensity to ${payload.intensity}`,
                    progress: `Setting intensity to ${payload.intensity}`,
                },
                // expectedState: { intensity: payload.intensity},
                parameters: [payload.intensity],
            };
        case 'wink':
            return {
                command: TahomaCommands.WINK,
                // expectedState: { repetitions: parseInt(payload.repetitions, 10) },
                labels: {
                    done: `Stopped`,
                    progress: `Winking ${payload.repetitions} time(s)`,
                },
                parameters: [parseInt(payload.repetitions, 10)],
            };
        default:
            return null;
    }
}
module.exports = (RED) => {
    RED.nodes.registerType('tahoma', function (props) {
        RED.nodes.createNode(this, props);
        this['device'] = props.device;
        this['tahomabox'] = props.tahomabox;
        this['name'] = props.name;
        this.on('input', async (msg) => {
            try {
                const instructions = generateInstructionsFromPayload(msg.payload);
                if (instructions === null) {
                    return;
                }
                const command = {
                    name: instructions.command,
                    parameters: instructions.parameters || [],
                };
                if (msg.payload.lowspeed &&
                    instructions.command !== 'stop' &&
                    typeof instructions.expectedState?.position === 'number') {
                    const targetPosition = instructions.expectedState.position || 0;
                    command.name = 'position_low_speed';
                    command.parameters = [targetPosition];
                }
                this.status({
                    fill: 'yellow',
                    shape: 'dot',
                    text: instructions.labels.progress,
                });
                const configNode = RED.nodes.getNode(this['tahomabox']);
                if (!configNode) {
                    throw new Error('TaHoma configuration node not found');
                }
                const somfyApiClient = new somfy_api_1.SomfyApi(configNode);
                let myTargetPosition;
                let myTargetOrientation;
                if (instructions.command === TahomaCommands.MY) {
                    const states = await somfyApiClient.getDeviceStates(this['device']);
                    const getValue = (name) => states.find((state) => state.name.split(':').pop() === name)
                        ?.value;
                    const positionValue = getValue('Memorized1PositionState');
                    const position = Number(positionValue);
                    if (positionValue === undefined ||
                        positionValue === null ||
                        !Number.isFinite(position)) {
                        throw new Error('Memorized1PositionState is unavailable');
                    }
                    myTargetPosition = position;
                    const orientation = getValue('Memorized1OrientationState');
                    if (orientation !== undefined &&
                        orientation !== null &&
                        Number.isFinite(Number(orientation))) {
                        myTargetOrientation = Number(orientation);
                    }
                    instructions.expectedState = {
                        position: myTargetPosition,
                        ...(myTargetOrientation !== undefined
                            ? { orientation: myTargetOrientation }
                            : {}),
                    };
                }
                const commandExecutionResponse = await somfyApiClient.execute(this['device'], command);
                if (instructions.expectedState) {
                    await continueWhenCompleted(configNode, commandExecutionResponse.execId);
                    if (instructions.command === TahomaCommands.MY) {
                        if (myTargetPosition === undefined) {
                            throw new Error('My target position is unavailable');
                        }
                        await waitForMyPosition(somfyApiClient, this['device'], myTargetPosition, myTargetOrientation);
                    }
                    else if (instructions.command === TahomaCommands.STOP) {
                        await waitForStopped(somfyApiClient, this['device']);
                    }
                    else {
                        await waitForExpectedDeviceState(somfyApiClient, this['device'], instructions.expectedState);
                    }
                }
                this.status({
                    fill: 'green',
                    shape: 'dot',
                    text: instructions.labels.done,
                });
                this.send(msg);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'TaHoma not reachable',
                });
                this.error(`TaHoma error: ${message}`, msg);
            }
        });
    });
};
