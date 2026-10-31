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
var somfy_cloud_api_1 = require("../core/somfy-cloud-api");
var http_response_enum_1 = require("../enums/http-response.enum");
var REGIONAL_SERVERS = {
    europe: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI',
    america: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI',
    oceania: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI',
};
/**
 * Extract useful diagnostic information from an unknown error.
 * Never include credentials or session information in logs.
 */
var getErrorDetails = function (error) {
    var _a;
    var err = error;
    return {
        message: (err === null || err === void 0 ? void 0 : err.message) || 'Unknown error',
        code: err === null || err === void 0 ? void 0 : err.code,
        status: (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status,
    };
};
/**
 * Return an appropriate HTTP status for an API error.
 */
var getHttpStatus = function (error, fallback) {
    var details = getErrorDetails(error);
    if (details.status && details.status >= 400 && details.status <= 599) {
        return details.status;
    }
    return fallback;
};
/**
 * Safely close an API session without masking the original error.
 */
var safeLogout = function (api) {
    try {
        api.logout();
    }
    catch (error) {
        var details = getErrorDetails(error);
        console.warn("[TaHoma Cloud] Logout failed: ".concat(details.message));
    }
};
module.exports = function (RED) {
    RED.nodes.registerType('tahoma-cloud-config', function (props) {
        RED.nodes.createNode(this, props);
        this['name'] = props.name;
        this['region'] = props.region;
        var credentials = this.credentials;
        var serverUrl = REGIONAL_SERVERS[props.region];
        this['createApi'] =
            serverUrl && (credentials === null || credentials === void 0 ? void 0 : credentials.userId) && (credentials === null || credentials === void 0 ? void 0 : credentials.userPassword)
                ? function () {
                    return new somfy_cloud_api_1.SomfyCloudApi(credentials.userId, credentials.userPassword, serverUrl);
                }
                : null;
    }, {
        credentials: {
            userId: { type: 'text' },
            userPassword: { type: 'password' },
        },
    });
    /**
     * Test Somfy Cloud connection.
     *
     * Authentication and scenario discovery are reported separately
     * to make troubleshooting easier.
     */
    RED.httpAdmin.post('/somfy/cloud/test', function (request, response) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, configNodeId, submittedUserId, submittedPassword, region, serverUrl, configNode, storedCredentials, userId, userPassword, api, authenticated, actionGroups, error_1, details, status_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = request.body || {}, configNodeId = _a.configNodeId, submittedUserId = _a.userId, submittedPassword = _a.userPassword, region = _a.region;
                    serverUrl = REGIONAL_SERVERS[region];
                    configNode = configNodeId
                        ? RED.nodes.getNode(configNodeId)
                        : null;
                    storedCredentials = configNode === null || configNode === void 0 ? void 0 : configNode.credentials;
                    userId = submittedUserId || (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.userId);
                    userPassword = submittedPassword || (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.userPassword);
                    if (!userId || !userPassword || !serverUrl) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            success: false,
                            error: 'Missing credentials or invalid region',
                        });
                        return [2 /*return*/];
                    }
                    api = new somfy_cloud_api_1.SomfyCloudApi(userId, userPassword, serverUrl);
                    authenticated = false;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    // Step 1: Authenticate with Somfy Cloud.
                    return [4 /*yield*/, api.login()];
                case 2:
                    // Step 1: Authenticate with Somfy Cloud.
                    _b.sent();
                    authenticated = true;
                    RED.log.info("[TaHoma Cloud Test] Authentication successful (region: ".concat(region, ")"));
                    return [4 /*yield*/, api.getActionGroups()];
                case 3:
                    actionGroups = _b.sent();
                    RED.log.info("[TaHoma Cloud Test] Successfully retrieved ".concat(actionGroups.length, " scenarios"));
                    response.json({
                        success: true,
                        authenticated: true,
                        scenarioCount: actionGroups.length,
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _b.sent();
                    details = getErrorDetails(error_1);
                    RED.log.error("[TaHoma Cloud Test] ".concat(authenticated ? 'Scenario discovery' : 'Authentication', " failed. ") +
                        "Message: ".concat(details.message, ", ") +
                        "HTTP status: ".concat(details.status || 'N/A', ", ") +
                        "Code: ".concat(details.code || 'N/A'));
                    status_1 = getHttpStatus(error_1, authenticated ? http_response_enum_1.HttpResponse.SERVER_ERROR : http_response_enum_1.HttpResponse.UNAUTHORIZED);
                    response.status(status_1);
                    response.json({
                        success: false,
                        authenticated: authenticated,
                        error: authenticated
                            ? 'Authentication successful, but scenario discovery failed'
                            : 'Somfy Cloud authentication failed',
                        details: details.message,
                        code: details.code,
                        httpStatus: details.status,
                    });
                    return [3 /*break*/, 6];
                case 5:
                    safeLogout(api);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Retrieve scenarios for an existing TaHoma Cloud configuration node.
     */
    RED.httpAdmin.get('/somfy/cloud/:account/scenarios', function (request, response) { return __awaiter(void 0, void 0, void 0, function () {
        var configNode, createApi, api, actionGroups, error_2, details;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    configNode = RED.nodes.getNode(request.params.account);
                    if (!configNode) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            error: 'TaHoma Cloud configuration not found',
                        });
                        return [2 /*return*/];
                    }
                    createApi = configNode['createApi'];
                    if (!createApi) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            error: 'Cloud credentials are missing',
                        });
                        return [2 /*return*/];
                    }
                    api = createApi();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, api.login()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, api.getActionGroups()];
                case 3:
                    actionGroups = _a.sent();
                    response.json({
                        scenarios: actionGroups.map(function (group) { return ({
                            id: group.oid,
                            name: group.label,
                        }); }),
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    details = getErrorDetails(error_2);
                    RED.log.error("[TaHoma Cloud] Unable to retrieve scenarios. " +
                        "Message: ".concat(details.message, ", ") +
                        "HTTP status: ".concat(details.status || 'N/A', ", ") +
                        "Code: ".concat(details.code || 'N/A'));
                    response.status(getHttpStatus(error_2, http_response_enum_1.HttpResponse.SERVER_ERROR));
                    response.json({
                        error: 'Unable to retrieve Somfy scenarios',
                        details: details.message,
                        code: details.code,
                        httpStatus: details.status,
                    });
                    return [3 /*break*/, 6];
                case 5:
                    safeLogout(api);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); });
};
