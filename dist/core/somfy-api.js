"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SomfyApi = void 0;
var axios_1 = require("axios");
var http_response_enum_1 = require("../enums/http-response.enum");
var https = require("https");
var SomfyApi = /** @class */ (function () {
    function SomfyApi(configNode) {
        var _this = this;
        this.axiosInstance = axios_1.default.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
        this.configNode = configNode;
        this.axiosInstance.interceptors.request.use(function (config) {
            config.headers['Authorization'] = "Bearer ".concat(_this.getAccessToken());
            return config;
        }, function (error) {
            return Promise.reject(error);
        });
    }
    SomfyApi.getSessionId = function (userId, userPwd, somfyOverkizSrvUrl) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, axios_1.default)({
                        url: "".concat(somfyOverkizSrvUrl, "/login"),
                        method: 'POST',
                        data: "userId=".concat(userId, "&userPassword=").concat(userPwd),
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    })
                        .then(function (response) {
                        var cookieHeader = response.headers['set-cookie'];
                        if (!cookieHeader) {
                            return null;
                        }
                        var sessionCookie = cookieHeader.find(function (c) {
                            return c.startsWith('JSESSIONID');
                        });
                        if (!sessionCookie) {
                            return null;
                        }
                        return sessionCookie.substring(sessionCookie.indexOf('=') + 1, sessionCookie.indexOf(';'));
                    })
                        .catch(function () { return null; })];
            });
        });
    };
    SomfyApi.getLocalToken = function (userId, userPwd, tahomaPin, somfyOverkizSrvUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, response, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, SomfyApi.getSessionId(userId, userPwd, somfyOverkizSrvUrl)];
                    case 1:
                        sessionId = _a.sent();
                        if (sessionId === null) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, (0, axios_1.default)({
                                url: "".concat(somfyOverkizSrvUrl, "/config/").concat(tahomaPin, "/local/tokens/generate"),
                                method: 'GET',
                                headers: {
                                    Cookie: "JSESSIONID=".concat(sessionId),
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        token = response.data.token;
                        if (!token) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, SomfyApi.activateLocalToken(token, tahomaPin, sessionId, somfyOverkizSrvUrl)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    SomfyApi.activateLocalToken = function (token, pin, sessionId, somfyOverkizSrvUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                now = new Date();
                return [2 /*return*/, (0, axios_1.default)({
                        url: "".concat(somfyOverkizSrvUrl, "/config/").concat(pin, "/local/tokens"),
                        method: 'POST',
                        data: {
                            token: token,
                            scope: 'devmode',
                            label: 'Node RED Instance ' +
                                now.getFullYear() +
                                "".concat(now.getMonth() + 1 < 10 ? '0' : '').concat(now.getMonth() + 1) +
                                "".concat(now.getDate() < 10 ? '0' : '').concat(now.getDate()) +
                                '-' +
                                now.getHours() +
                                'h' +
                                now.getMinutes() +
                                'm' +
                                now.getSeconds(),
                        },
                        headers: {
                            'Content-Type': 'application/json',
                            Cookie: "JSESSIONID=".concat(sessionId),
                        },
                    })];
            });
        });
    };
    SomfyApi.prototype._request = function (options) {
        return this.axiosInstance(options).then(function (response) {
            if (response.status !== http_response_enum_1.HttpResponse.OK) {
                return 'http_error';
            }
            return response.data;
        });
    };
    SomfyApi.prototype.getAccessToken = function () {
        return this.configNode['token'];
    };
    SomfyApi.prototype.getGatewayUrl = function () {
        if (!this.configNode || !this.configNode['url']) {
            return undefined;
        }
        return "".concat(this.configNode['url'], "/enduser-mobile-web/1/enduserAPI");
    };
    SomfyApi.prototype.getDevice = function (device) {
        var sanitizedDeviceUrl = encodeURIComponent(device);
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/setup/devices/").concat(sanitizedDeviceUrl),
            method: 'GET',
        });
    };
    SomfyApi.prototype.getDeviceStates = function (device) {
        var sanitizedDeviceUrl = encodeURIComponent(device);
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/setup/devices/").concat(sanitizedDeviceUrl, "/states"),
            method: 'GET',
        });
    };
    SomfyApi.prototype.getDevices = function () {
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/setup/devices"),
            method: 'GET',
        });
    };
    SomfyApi.prototype.execute = function (device, command) {
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/exec/apply"),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                label: 'Node-RED Tahoma Command',
                actions: [
                    {
                        commands: [command],
                        deviceURL: device,
                    },
                ],
            },
        });
    };
    SomfyApi.prototype.getStatusForExecutionId = function (execId) {
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/exec/current/").concat(execId),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    };
    return SomfyApi;
}());
exports.SomfyApi = SomfyApi;
