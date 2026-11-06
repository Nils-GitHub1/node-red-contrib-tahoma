"use strict";
const somfy_api_1 = require("../core/somfy-api");
module.exports = (RED) => {
    RED.nodes.registerType('tahoma-read', function (props) {
        RED.nodes.createNode(this, props);
        const config = RED.nodes.getNode(props['tahomabox']);
        this['device'] = props.device;
        this['tahomabox'] = props.tahomabox;
        this['name'] = props.name;
        this.on('input', (msg) => {
            const somfyClient = new somfy_api_1.SomfyApi(config);
            somfyClient
                .getDevice(this['device'])
                .then((deviceData) => {
                msg.payload = deviceData;
                this.send(msg);
            })
                .catch((error) => {
                const message = error instanceof Error ? error.message : String(error);
                this.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'TaHoma not reachable',
                });
                this.error(`TaHoma error: ${message}`, msg);
            });
        });
    });
};
