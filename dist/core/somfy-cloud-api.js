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
    function SomfyCloudApi(userIdOrAuth, userPassword, serverUrl) {
        this.sessionId = null;
        if (typeof userIdOrAuth === 'string') {
            if (!userIdOrAuth || !userPassword || !serverUrl) {
                throw new Error('Somfy Cloud: missing legacy credentials or server URL');
            }
            this.authMethod = 'legacy';
            this.userId = userIdOrAuth;
            this.userPassword = userPassword;
            this.serverUrl = serverUrl.replace(/\/+$/, '');
        }
        else {
            if (!userIdOrAuth) {
                throw new Error('Somfy Cloud: OAuth authentication instance is required');
            }
            this.authMethod = 'oauth';
            this.oauthAuth = userIdOrAuth;
            // The OAuth endpoint is determined by the selected
            // Somfy installation, not by the legacy region setting.
            this.serverUrl = '';
        }
        this.axiosInstance = axios_1.default.create({
            timeout: 20000,
            headers: {
                Accept: 'application/json',
            },
        });
    }
    /**
     * Authenticate against Somfy Cloud.
     *
     * The authentication strategy is selected by the constructor.
     */
    SomfyCloudApi.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.authMethod === 'legacy')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loginLegacy()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (!this.oauthAuth) {
                            throw new Error('Somfy Cloud: OAuth authentication is unavailable');
                        }
                        return [4 /*yield*/, this.oauthAuth.login()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy JSESSIONID authentication.
     */
    SomfyCloudApi.prototype.loginLegacy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.userId || !this.userPassword) {
                            throw new Error('Somfy Cloud: legacy credentials are missing');
                        }
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
                        // Preserve the original Axios or authentication error.
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check whether a local authentication context is available.
     *
     * This is a local check only and does not make an HTTP request.
     */
    SomfyCloudApi.prototype.hasSession = function () {
        var _a;
        if (this.authMethod === 'legacy') {
            return this.sessionId !== null;
        }
        return ((_a = this.oauthAuth) === null || _a === void 0 ? void 0 : _a.isAuthenticated()) === true;
    };
    /**
     * Check whether the current session is valid.
     *
     * This performs an actual request to actionGroups.
     */
    SomfyCloudApi.prototype.isAuthenticated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.hasSession()) {
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
            var response, actionGroups, _i, actionGroups_1, group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.request({
                            url: "".concat(this.getEndpoint(), "actionGroups"),
                            method: 'GET',
                        })];
                    case 1:
                        response = _a.sent();
                        actionGroups = response.data;
                        if (!Array.isArray(actionGroups)) {
                            throw new Error('Invalid action groups response from Somfy Cloud: ' +
                                'expected an array');
                        }
                        for (_i = 0, actionGroups_1 = actionGroups; _i < actionGroups_1.length; _i++) {
                            group = actionGroups_1[_i];
                            if (!group ||
                                typeof group.oid !== 'string' ||
                                typeof group.label !== 'string') {
                                throw new Error('Invalid action group received from Somfy Cloud: ' +
                                    'missing oid or label');
                            }
                        }
                        return [2 /*return*/, actionGroups];
                }
            });
        });
    };
    /**
     * Execute an existing TaHoma scenario.
     *
     * Execution is deliberately not retried automatically.
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
                                url: "".concat(this.getEndpoint(), "exec/") + encodeURIComponent(actionGroupId),
                                method: 'POST',
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.data ||
                            typeof response.data.execId !== 'string' ||
                            !response.data.execId) {
                            throw new Error('Invalid scenario execution response from Somfy Cloud');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    /**
     * Resolve the active cloud API endpoint.
     *
     * Legacy:
     * Uses the regional URL supplied to the constructor.
     *
     * OAuth:
     * Uses the endpoint selected by SomfyCloudNewAuth.
     */
    SomfyCloudApi.prototype.getEndpoint = function () {
        if (this.authMethod === 'legacy') {
            return "".concat(this.serverUrl.replace(/\/+$/, ''), "/");
        }
        if (!this.oauthAuth) {
            throw new Error('Somfy Cloud: OAuth authentication is unavailable');
        }
        return this.oauthAuth.endpoint;
    };
    /**
     * Generate the authentication headers.
     *
     * Legacy:
     * Cookie: JSESSIONID=...
     *
     * OAuth:
     * Authorization: Bearer ...
     */
    SomfyCloudApi.prototype.getAuthenticationHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.authMethod === 'legacy') {
                    if (!this.sessionId) {
                        throw new Error('Not authenticated with Somfy Cloud');
                    }
                    return [2 /*return*/, {
                            Cookie: "JSESSIONID=".concat(this.sessionId),
                        }];
                }
                if (!this.oauthAuth) {
                    throw new Error('Somfy Cloud: OAuth authentication is unavailable');
                }
                return [2 /*return*/, this.oauthAuth.getAuthHeaders()];
            });
        });
    };
    /**
     * Execute an authenticated cloud API request.
     *
     * The OAuth authentication strategy automatically handles
     * access-token expiration and refresh before returning headers.
     *
     * Axios errors are deliberately preserved so that the
     * configuration node can inspect HTTP status and error codes.
     */
    SomfyCloudApi.prototype.request = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var authHeaders, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAuthenticationHeaders()];
                    case 1:
                        authHeaders = _a.sent();
                        config = __assign(__assign({}, options), { headers: __assign(__assign({}, options.headers), authHeaders) });
                        return [2 /*return*/, this.axiosInstance.request(config)];
                }
            });
        });
    };
    /**
     * Invalidate the current local session.
     *
     * Legacy:
     * Clears the JSESSIONID.
     *
     * OAuth:
     * Does not delete the refresh token. A subsequent request
     * can continue using the OAuth refresh mechanism.
     */
    SomfyCloudApi.prototype.invalidateSession = function () {
        if (this.authMethod === 'legacy') {
            this.sessionId = null;
        }
    };
    /**
     * Clear the local authentication context.
     *
     * This does not revoke tokens or sessions on Somfy servers.
     */
    SomfyCloudApi.prototype.logout = function () {
        var _a;
        if (this.authMethod === 'legacy') {
            this.invalidateSession();
            return;
        }
        (_a = this.oauthAuth) === null || _a === void 0 ? void 0 : _a.logout();
    };
    /**
     * Return the selected authentication method.
     */
    SomfyCloudApi.prototype.getAuthMethod = function () {
        return this.authMethod;
    };
    /**
     * Return the OAuth authentication instance.
     *
     * Returns undefined when using legacy authentication.
     */
    SomfyCloudApi.prototype.getOAuthAuth = function () {
        return this.oauthAuth;
    };
    return SomfyCloudApi;
}());
exports.SomfyCloudApi = SomfyCloudApi;
