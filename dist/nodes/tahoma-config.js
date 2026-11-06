"use strict";
const somfy_api_1 = require("../core/somfy-api");
const http_response_enum_1 = require("../enums/http-response.enum");
module.exports = (RED) => {
    RED.nodes.registerType('tahoma-config', function (props) {
        RED.nodes.createNode(this, props);
        this['pin'] = props.pin;
        this['name'] = props.name;
        this['token'] = props.token;
        this['url'] = props.url;
        // Default to secure HTTPS certificate verification.
        this['acceptUntrustedCertificates'] =
            props.acceptUntrustedCertificates === true;
    });
    RED.httpAdmin.post('/somfy/get-token', async (request, response) => {
        const { userId, userPassword, tahomaPin, somfyOverkizSrvUrl } = request.body;
        // Cloud authentication and token generation retain normal
        // HTTPS certificate verification.
        const token = await somfy_api_1.SomfyApi.getLocalToken(userId, userPassword, tahomaPin, somfyOverkizSrvUrl);
        if (token === null) {
            response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
            response.send();
            return;
        }
        response.json({ token: token });
    });
    RED.httpAdmin.get('/somfy/:account/devices', function (req, res) {
        const configNode = RED.nodes.getNode(req.params.account);
        const acceptUntrustedCertificates = configNode?.['acceptUntrustedCertificates'] === true;
        const somfyApiClient = new somfy_api_1.SomfyApi(configNode, acceptUntrustedCertificates);
        somfyApiClient
            .getDevices()
            .then((devices) => {
            res.json(devices
                .filter((device) => {
                return (device.controllableName !== 'io:StackComponent' &&
                    device.enabled &&
                    device.available &&
                    device.synced);
            })
                .map((device) => {
                return {
                    id: device.deviceURL,
                    name: device.label,
                };
            }));
        })
            .catch(() => {
            res.status(http_response_enum_1.HttpResponse.SERVER_ERROR);
            res.send();
        });
    });
};
