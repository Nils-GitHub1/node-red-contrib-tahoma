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
exports.SomfyCloudApi = void 0;
var axios_1 = require("axios");
var somfy_api_1 = require("./somfy-api");
var SomfyCloudApi = /** @class */ (function () {
    function SomfyCloudApi(userId, userPassword, serverUrl) {
        this.sessionId = null;
        this.userId = userId;
        this.userPassword = userPassword;
        this.serverUrl = serverUrl.replace(/\/$/, '');
        this.axiosInstance = axios_1.default.create({
            timeout: 20000,
        });
    }
    /**
     * Authenticate against the Somfy Overkiz cloud.
     *
     * Special characters in the username and password are handled
     * by SomfyApi.getSessionId() using URLSearchParams.
     */
    SomfyCloudApi.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.sessionId = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, somfy_api_1.SomfyApi.getSessionId(this.userId, this.userPassword, this.serverUrl)];
                    case 2:
                        sessionId = _a.sent();
                        if (!sessionId) {
                            throw new Error('Somfy Cloud did not return a valid JSESSIONID cookie. ' +
                                'Check credentials, region and account permissions.');
                        }
                        this.sessionId = sessionId;
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.sessionId = null;
                        if (error_1 instanceof Error) {
                            throw new Error("Somfy Cloud authentication failed: ".concat(error_1.message));
                        }
                        throw new Error('Somfy Cloud authentication failed');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check whether the current session is still valid.
     *
     * Note: this checks both authentication and access to actionGroups.
     * A permission error may therefore return false even when login
     * itself was successful.
     */
    SomfyCloudApi.prototype.isAuthenticated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.sessionId) {
                            return [2 /*return*/, false];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getActionGroups()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieve scenarios already created in the TaHoma application.
     */
    SomfyCloudApi.prototype.getActionGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.request({
                            url: "".concat(this.serverUrl, "/actionGroups"),
                            method: 'GET',
                        })];
                    case 1:
                        response = _a.sent();
                        if (!Array.isArray(response.data)) {
                            throw new Error('Invalid action groups response from Somfy Cloud');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    /**
     * Execute an existing TaHoma scenario.
     */
    SomfyCloudApi.prototype.executeActionGroup = function (actionGroupId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!actionGroupId) {
                            throw new Error('Action group ID is required');
                        }
                        return [4 /*yield*/, this.request({
                                url: "".concat(this.serverUrl, "/exec/").concat(encodeURIComponent(actionGroupId)),
                                method: 'POST',
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.data || !response.data.execId) {
                            throw new Error('Invalid scenario execution response');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    /**
     * Clear the local cloud session.
     * This does not revoke the session on the Somfy server.
     */
    SomfyCloudApi.prototype.logout = function () {
        this.sessionId = null;
    };
    /**
     * Perform an authenticated cloud request.
     */
    SomfyCloudApi.prototype.request = function (options) {
        if (!this.sessionId) {
            return Promise.reject(new Error('Not authenticated with Somfy Cloud'));
        }
        var config = __assign(__assign({}, options), { headers: __assign(__assign({}, options.headers), { Cookie: "JSESSIONID=".concat(this.sessionId) }) });
        return this.axiosInstance.request(config).catch(function (error) {
            var _a, _b;
            if (axios_1.default.isAxiosError(error)) {
                var status_1 = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
                var responseData = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data;
                throw new Error("Somfy Cloud API request failed" +
                    (status_1 ? " (HTTP ".concat(status_1, ")") : '') +
                    (responseData
                        ? ": ".concat(JSON.stringify(responseData))
                        : error.message));
            }
            throw error;
        });
    };
    return SomfyCloudApi;
}());
exports.SomfyCloudApi = SomfyCloudApi;
