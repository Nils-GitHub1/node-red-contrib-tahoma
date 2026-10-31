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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SomfyApi = void 0;
var axios_1 = require("axios");
var https = require("https");
/**
 * Default timeout for Somfy API requests.
 */
var API_TIMEOUT = 20000;
var SomfyApi = /** @class */ (function () {
    /**
     * Initialize the Somfy API client.
     *
     * @param configNode Node-RED configuration node.
     * @param acceptUntrustedCertificates Whether to disable HTTPS
     * certificate verification for the local TaHoma connection.
     *
     * Certificate verification is enabled by default.
     */
    function SomfyApi(configNode, acceptUntrustedCertificates) {
        if (acceptUntrustedCertificates === void 0) { acceptUntrustedCertificates = (configNode === null || configNode === void 0 ? void 0 : configNode['acceptUntrustedCertificates']) === true; }
        var _this = this;
        this.configNode = configNode;
        if (acceptUntrustedCertificates === true) {
            // Allow untrusted certificates ONLY for this local API instance.
            this.axiosInstance = axios_1.default.create({
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            });
        }
        else {
            // Normal HTTPS certificate verification.
            this.axiosInstance = axios_1.default.create();
        }
        this.axiosInstance.interceptors.request.use(function (config) {
            var accessToken = _this.getAccessToken();
            config.headers = config.headers || {};
            config.headers['Authorization'] = "Bearer ".concat(accessToken);
            return config;
        }, function (error) {
            return Promise.reject(error);
        });
    }
    /**
     * Authenticate against the Somfy / Overkiz API.
     *
     * Returns the JSESSIONID extracted from the response cookies.
     */
    SomfyApi.getSessionId = function (userId, userPwd, somfyOverkizSrvUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var loginData, response, cookieHeader, cookies, sessionCookie, cookieValue, separatorIndex, sessionId, error_1, status_1, responseData, serverError;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!userId || !userPwd || !somfyOverkizSrvUrl) {
                            throw new Error('Somfy login: missing credentials or server URL');
                        }
                        loginData = new URLSearchParams({
                            userId: userId,
                            userPassword: userPwd,
                        });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, axios_1.default)({
                                url: "".concat(somfyOverkizSrvUrl.replace(/\/+$/, ''), "/login"),
                                method: 'POST',
                                data: loginData.toString(),
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    Accept: 'application/json, text/plain, */*',
                                },
                                timeout: API_TIMEOUT,
                            })];
                    case 2:
                        response = _c.sent();
                        cookieHeader = response.headers['set-cookie'];
                        cookies = Array.isArray(cookieHeader)
                            ? cookieHeader
                            : typeof cookieHeader === 'string'
                                ? [cookieHeader]
                                : [];
                        sessionCookie = cookies.find(function (cookie) {
                            return /^\s*JSESSIONID=/i.test(cookie);
                        });
                        if (!sessionCookie) {
                            throw new Error("Somfy login returned HTTP ".concat(response.status, ", ") +
                                'but no JSESSIONID cookie was found. ' +
                                "Content-Type: ".concat(response.headers['content-type'] || 'unknown', ". ") +
                                "Cookies received: ".concat(cookies.map(function (cookie) { return cookie.split('=')[0].trim(); }).join(', ') ||
                                    'none', "."));
                        }
                        cookieValue = sessionCookie.trim().split(';')[0];
                        separatorIndex = cookieValue.indexOf('=');
                        sessionId = separatorIndex >= 0
                            ? cookieValue.substring(separatorIndex + 1).trim()
                            : '';
                        if (!sessionId) {
                            throw new Error('Somfy returned an empty JSESSIONID cookie');
                        }
                        return [2 /*return*/, sessionId];
                    case 3:
                        error_1 = _c.sent();
                        if (axios_1.default.isAxiosError(error_1)) {
                            status_1 = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.status;
                            responseData = (_b = error_1.response) === null || _b === void 0 ? void 0 : _b.data;
                            serverError = typeof responseData === 'string'
                                ? responseData
                                : JSON.stringify(responseData || {});
                            throw new Error("Somfy login failed. " +
                                "HTTP: ".concat(status_1 || 'No response', ". ") +
                                "Code: ".concat(error_1.code || 'N/A', ". ") +
                                "Server response: ".concat(serverError || 'No response body'));
                        }
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate and activate a local access token.
     *
     * HTTPS certificate verification remains enabled.
     */
    SomfyApi.getLocalToken = function (userId, userPwd, tahomaPin, somfyOverkizSrvUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, serverUrl, sanitizedPin, response, token;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, SomfyApi.getSessionId(userId, userPwd, somfyOverkizSrvUrl)];
                    case 1:
                        sessionId = _b.sent();
                        if (!sessionId) {
                            return [2 /*return*/, null];
                        }
                        serverUrl = somfyOverkizSrvUrl.replace(/\/+$/, '');
                        sanitizedPin = encodeURIComponent(tahomaPin);
                        return [4 /*yield*/, (0, axios_1.default)({
                                url: "".concat(serverUrl, "/config/").concat(sanitizedPin, "/local/tokens/generate"),
                                method: 'GET',
                                headers: {
                                    Cookie: "JSESSIONID=".concat(sessionId),
                                    Accept: 'application/json',
                                },
                                timeout: API_TIMEOUT,
                            })];
                    case 2:
                        response = _b.sent();
                        token = (_a = response.data) === null || _a === void 0 ? void 0 : _a.token;
                        if (!token) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, SomfyApi.activateLocalToken(token, tahomaPin, sessionId, somfyOverkizSrvUrl)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    /**
     * Activate a generated local access token.
     *
     * HTTPS certificate verification remains enabled.
     */
    SomfyApi.activateLocalToken = function (token, pin, sessionId, somfyOverkizSrvUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var now, serverUrl, sanitizedPin, label;
            return __generator(this, function (_a) {
                now = new Date();
                serverUrl = somfyOverkizSrvUrl.replace(/\/+$/, '');
                sanitizedPin = encodeURIComponent(pin);
                label = 'Node RED Instance ' +
                    now.getFullYear() +
                    "".concat(now.getMonth() + 1 < 10 ? '0' : '').concat(now.getMonth() + 1) +
                    "".concat(now.getDate() < 10 ? '0' : '').concat(now.getDate()) +
                    '-' +
                    now.getHours() +
                    'h' +
                    now.getMinutes() +
                    'm' +
                    now.getSeconds();
                return [2 /*return*/, (0, axios_1.default)({
                        url: "".concat(serverUrl, "/config/").concat(sanitizedPin, "/local/tokens"),
                        method: 'POST',
                        data: {
                            token: token,
                            scope: 'devmode',
                            label: label,
                        },
                        headers: {
                            'Content-Type': 'application/json',
                            Cookie: "JSESSIONID=".concat(sessionId),
                        },
                        timeout: API_TIMEOUT,
                    })];
            });
        });
    };
    /**
     * Execute an authenticated API request.
     *
     * Axios automatically rejects HTTP responses outside the 2xx range.
     * The original error is preserved for better diagnostics.
     */
    SomfyApi.prototype._request = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.axiosInstance(__assign({ timeout: API_TIMEOUT }, options))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    /**
     * Retrieve the configured access token.
     */
    SomfyApi.prototype.getAccessToken = function () {
        var _a;
        var token = (_a = this.configNode) === null || _a === void 0 ? void 0 : _a['token'];
        if (typeof token !== 'string' || !token.trim()) {
            throw new Error('Somfy API: missing access token in configuration node');
        }
        return token;
    };
    /**
     * Retrieve the configured gateway URL.
     */
    SomfyApi.prototype.getGatewayUrl = function () {
        var _a;
        var configuredUrl = (_a = this.configNode) === null || _a === void 0 ? void 0 : _a['url'];
        if (typeof configuredUrl !== 'string' || !configuredUrl.trim()) {
            throw new Error('Somfy API: missing gateway URL in configuration node');
        }
        var baseUrl = configuredUrl.replace(/\/+$/, '');
        return "".concat(baseUrl, "/enduser-mobile-web/1/enduserAPI");
    };
    /**
     * Retrieve a device.
     */
    SomfyApi.prototype.getDevice = function (device) {
        var sanitizedDeviceUrl = encodeURIComponent(device);
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/setup/devices/").concat(sanitizedDeviceUrl),
            method: 'GET',
        });
    };
    /**
     * Retrieve device states.
     */
    SomfyApi.prototype.getDeviceStates = function (device) {
        var sanitizedDeviceUrl = encodeURIComponent(device);
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/setup/devices/").concat(sanitizedDeviceUrl, "/states"),
            method: 'GET',
        });
    };
    /**
     * Retrieve all configured devices.
     */
    SomfyApi.prototype.getDevices = function () {
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/setup/devices"),
            method: 'GET',
        });
    };
    /**
     * Execute a device command.
     */
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
    /**
     * Retrieve the status of a command execution.
     */
    SomfyApi.prototype.getStatusForExecutionId = function (execId) {
        var sanitizedExecId = encodeURIComponent(execId);
        return this._request({
            url: "".concat(this.getGatewayUrl(), "/exec/current/").concat(sanitizedExecId),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    };
    return SomfyApi;
}());
exports.SomfyApi = SomfyApi;
