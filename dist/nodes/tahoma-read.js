"use strict";
var somfy_api_1 = require("../core/somfy-api");
module.exports = function (RED) {
    RED.nodes.registerType('tahoma-read', function (props) {
        var _this = this;
        RED.nodes.createNode(this, props);
        var config = RED.nodes.getNode(props['tahomabox']);
        this['device'] = props.device;
        this['tahomabox'] = props.tahomabox;
        this['name'] = props.name;
        this.on('input', function (msg) {
            var somfyClient = new somfy_api_1.SomfyApi(config);
            somfyClient
                .getDevice(_this['device'])
                .then(function (deviceData) {
                msg.payload = deviceData;
                _this.send(msg);
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
