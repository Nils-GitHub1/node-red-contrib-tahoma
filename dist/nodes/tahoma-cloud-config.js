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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
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
 * Check whether an error indicates an expired or invalid session.
 */
var isAuthenticationError = function (error) {
    var status = getErrorDetails(error).status;
    return status === 401 || status === 403;
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
        var _this = this;
        RED.nodes.createNode(this, props);
        this['name'] = props.name;
        this['region'] = props.region;
        var credentials = this.credentials;
        var serverUrl = REGIONAL_SERVERS[props.region];
        /*
         * One API instance per configuration node.
         *
         * All cloud nodes using this configuration share the
         * same SomfyCloudApi instance and authenticated session.
         */
        var api = serverUrl && (credentials === null || credentials === void 0 ? void 0 : credentials.userId) && (credentials === null || credentials === void 0 ? void 0 : credentials.userPassword)
            ? new somfy_cloud_api_1.SomfyCloudApi(credentials.userId, credentials.userPassword, serverUrl)
            : null;
        /*
         * Shared scenario cache.
         *
         * null means that initial discovery has not succeeded yet.
         * An empty array is a valid, successfully retrieved result.
         */
        var scenarios = null;
        /*
         * Authentication state.
         */
        var authenticated = false;
        var loginPromise = null;
        /*
         * Scenario retrieval concurrency control.
         */
        var scenariosPromise = null;
        /*
         * Configuration-node lifecycle.
         */
        var closing = false;
        /**
         * Authenticate only when necessary.
         *
         * Concurrent callers share the same login operation.
         * The API instance is never recreated.
         */
        var ensureAuthenticated = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!api) {
                    throw new Error('Cloud credentials or regional server are missing');
                }
                if (closing) {
                    throw new Error('TaHoma Cloud configuration is closing');
                }
                if (authenticated) {
                    return [2 /*return*/];
                }
                if (loginPromise) {
                    return [2 /*return*/, loginPromise];
                }
                loginPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                    var error_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, 3, 4]);
                                return [4 /*yield*/, api.login()];
                            case 1:
                                _a.sent();
                                authenticated = true;
                                RED.log.info('[TaHoma Cloud] Authentication successful');
                                return [3 /*break*/, 4];
                            case 2:
                                error_1 = _a.sent();
                                authenticated = false;
                                throw error_1;
                            case 3:
                                loginPromise = null;
                                return [7 /*endfinally*/];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); })();
                return [2 /*return*/, loginPromise];
            });
        }); };
        /**
         * Retrieve scenarios from Somfy Cloud.
         *
         * If the session has expired, authenticate again and retry
         * the read operation once.
         *
         * Scenario retrieval is safe to retry because it does not
         * execute any action on the installation.
         */
        var fetchScenarios = function () { return __awaiter(_this, void 0, void 0, function () {
            var actionGroups, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!api) {
                            throw new Error('Cloud credentials or regional server are missing');
                        }
                        return [4 /*yield*/, ensureAuthenticated()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, api.getActionGroups()];
                    case 3:
                        actionGroups = _a.sent();
                        return [2 /*return*/, actionGroups.map(function (group) { return ({
                                id: group.oid,
                                name: group.label,
                            }); })];
                    case 4:
                        error_2 = _a.sent();
                        if (!isAuthenticationError(error_2)) {
                            throw error_2;
                        }
                        RED.log.warn('[TaHoma Cloud] Session expired while retrieving scenarios. Re-authenticating.');
                        authenticated = false;
                        return [4 /*yield*/, ensureAuthenticated()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, api.getActionGroups()];
                    case 6: 
                    // Retry scenario retrieval once after authentication.
                    return [2 /*return*/, (_a.sent()).map(function (group) { return ({
                            id: group.oid,
                            name: group.label,
                        }); })];
                    case 7: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Get or refresh scenarios.
         *
         * Normal calls use the cache.
         * Forced refreshes retrieve the latest scenarios.
         *
         * Concurrent retrieval requests share the same Promise.
         * The existing cache is only replaced after successful retrieval.
         */
        var retrieveScenarios = function () {
            var args_1 = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args_1[_i] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (forceRefresh) {
                var error_3, details;
                var _this = this;
                if (forceRefresh === void 0) { forceRefresh = false; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (closing) {
                                throw new Error('TaHoma Cloud configuration is closing');
                            }
                            if (!api) {
                                throw new Error('Cloud credentials or regional server are missing');
                            }
                            if (scenarios !== null && !forceRefresh) {
                                return [2 /*return*/, scenarios];
                            }
                            if (scenariosPromise) {
                                return [2 /*return*/, scenariosPromise];
                            }
                            scenariosPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                                var updatedScenarios;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, fetchScenarios()];
                                        case 1:
                                            updatedScenarios = _a.sent();
                                            if (closing) {
                                                throw new Error('TaHoma Cloud configuration is closing');
                                            }
                                            // Replace the cache only after a successful retrieval.
                                            scenarios = updatedScenarios;
                                            RED.log.info("[TaHoma Cloud] Scenario cache updated: ".concat(scenarios.length, " scenarios"));
                                            return [2 /*return*/, scenarios];
                                    }
                                });
                            }); })();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, scenariosPromise];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3:
                            error_3 = _a.sent();
                            details = getErrorDetails(error_3);
                            RED.log.error("[TaHoma Cloud] Unable to retrieve scenarios. " +
                                "Message: ".concat(details.message, ", ") +
                                "HTTP status: ".concat(details.status || 'N/A', ", ") +
                                "Code: ".concat(details.code || 'N/A'));
                            throw error_3;
                        case 4:
                            scenariosPromise = null;
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Execute a scenario using the shared API instance.
         *
         * IMPORTANT:
         * Execution is deliberately NOT retried after an authentication
         * error. This avoids the risk of executing a scenario twice
         * if the server processed the request but its response failed.
         *
         * The next operation will authenticate again when necessary.
         */
        var executeScenario = function (scenarioId) { return __awaiter(_this, void 0, void 0, function () {
            var execution, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!api) {
                            throw new Error('Cloud credentials or regional server are missing');
                        }
                        if (!scenarioId || typeof scenarioId !== 'string') {
                            throw new Error('A valid scenario ID is required');
                        }
                        if (closing) {
                            throw new Error('TaHoma Cloud configuration is closing');
                        }
                        return [4 /*yield*/, ensureAuthenticated()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, api.executeActionGroup(scenarioId)];
                    case 3:
                        execution = _a.sent();
                        return [2 /*return*/, {
                                execId: execution.execId,
                            }];
                    case 4:
                        error_4 = _a.sent();
                        if (isAuthenticationError(error_4)) {
                            // Mark the session as invalid for the next operation.
                            // Do not automatically retry scenario execution.
                            authenticated = false;
                            RED.log.warn('[TaHoma Cloud] Session expired during scenario execution. ' +
                                'The execution was not automatically retried.');
                        }
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        /*
         * Public configuration-node API.
         *
         * All three cloud nodes use these methods instead of
         * creating independent SomfyCloudApi instances.
         */
        /**
         * Return cached scenarios, discovering them if necessary.
         */
        this['getScenarios'] = function () {
            return retrieveScenarios(false);
        };
        /**
         * Force scenario discovery using the existing session.
         */
        this['refreshScenarios'] = function () {
            return retrieveScenarios(true);
        };
        /**
         * Execute a scenario through the shared authenticated session.
         */
        this['executeScenario'] = function (scenarioId) { return executeScenario(scenarioId); };
        /**
         * Find a scenario by ID.
         */
        this['getScenarioById'] = function (id) { return __awaiter(_this, void 0, void 0, function () {
            var availableScenarios;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, retrieveScenarios(false)];
                    case 1:
                        availableScenarios = _a.sent();
                        return [2 /*return*/, availableScenarios.find(function (scenario) { return scenario.id === id; })];
                }
            });
        }); };
        /**
         * Check whether the scenario cache has been initialized.
         */
        this['isScenarioCacheReady'] = function () { return scenarios !== null; };
        /**
         * Backward compatibility with existing nodes.
         *
         * Returns the shared API instance, not a new instance.
         *
         * Callers must NOT independently call login() or logout().
         */
        this['createApi'] = api ? function () { return api; } : null;
        /*
         * Initial scenario discovery.
         *
         * Runs once per configuration-node instance.
         * Other cloud nodes reuse the resulting cache.
         */
        if (api) {
            retrieveScenarios().catch(function () {
                RED.log.warn('[TaHoma Cloud] Initial scenario discovery failed. ' +
                    'Scenarios can be retrieved later using Refresh scenarios.');
            });
        }
        else {
            RED.log.warn('[TaHoma Cloud] Scenario discovery skipped: credentials or region missing.');
        }
        /*
         * Configuration-node shutdown.
         *
         * Clear the local session when the configuration node closes.
         */
        this.on('close', function (removed, done) {
            closing = true;
            authenticated = false;
            if (api) {
                safeLogout(api);
            }
            if (typeof done === 'function') {
                done();
            }
        });
    }, {
        credentials: {
            userId: { type: 'text' },
            userPassword: { type: 'password' },
        },
    });
    /**
     * Test Somfy Cloud connection.
     *
     * Uses an independent API instance so that testing credentials
     * does not affect the active configuration node's session/cache.
     */
    RED.httpAdmin.post('/somfy/cloud/test', function (request, response) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, configNodeId, submittedUserId, submittedPassword, region, serverUrl, configNode, storedCredentials, userId, userPassword, testApi, authenticated, actionGroups, error_5, details, status_1;
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
                    testApi = new somfy_cloud_api_1.SomfyCloudApi(userId, userPassword, serverUrl);
                    authenticated = false;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, testApi.login()];
                case 2:
                    _b.sent();
                    authenticated = true;
                    RED.log.info("[TaHoma Cloud Test] Authentication successful (region: ".concat(region, ")"));
                    return [4 /*yield*/, testApi.getActionGroups()];
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
                    error_5 = _b.sent();
                    details = getErrorDetails(error_5);
                    RED.log.error("[TaHoma Cloud Test] ".concat(authenticated ? 'Scenario discovery' : 'Authentication', " failed. ") +
                        "Message: ".concat(details.message, ", ") +
                        "HTTP status: ".concat(details.status || 'N/A', ", ") +
                        "Code: ".concat(details.code || 'N/A'));
                    status_1 = getHttpStatus(error_5, authenticated ? http_response_enum_1.HttpResponse.SERVER_ERROR : http_response_enum_1.HttpResponse.UNAUTHORIZED);
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
                    safeLogout(testApi);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Retrieve scenarios for an existing configuration node.
     *
     * Normal requests read the shared cache.
     * Requests with ?refresh=true force a new cloud retrieval.
     */
    RED.httpAdmin.get('/somfy/cloud/:account/scenarios', function (request, response) { return __awaiter(void 0, void 0, void 0, function () {
        var configNode, getScenarios, refreshScenarios, forceRefresh, availableScenarios, _a, error_6, details;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    configNode = RED.nodes.getNode(request.params.account);
                    if (!configNode) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            error: 'TaHoma Cloud configuration not found',
                        });
                        return [2 /*return*/];
                    }
                    getScenarios = configNode['getScenarios'];
                    refreshScenarios = configNode['refreshScenarios'];
                    if (!getScenarios || !refreshScenarios) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            error: 'TaHoma Cloud scenario manager is unavailable',
                        });
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    forceRefresh = ((_b = request.query) === null || _b === void 0 ? void 0 : _b.refresh) === 'true';
                    if (!forceRefresh) return [3 /*break*/, 3];
                    return [4 /*yield*/, refreshScenarios()];
                case 2:
                    _a = _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, getScenarios()];
                case 4:
                    _a = _c.sent();
                    _c.label = 5;
                case 5:
                    availableScenarios = _a;
                    response.json({
                        scenarios: availableScenarios,
                    });
                    return [3 /*break*/, 7];
                case 6:
                    error_6 = _c.sent();
                    details = getErrorDetails(error_6);
                    RED.log.error("[TaHoma Cloud] Unable to retrieve scenarios. " +
                        "Message: ".concat(details.message, ", ") +
                        "HTTP status: ".concat(details.status || 'N/A', ", ") +
                        "Code: ".concat(details.code || 'N/A'));
                    response.status(getHttpStatus(error_6, http_response_enum_1.HttpResponse.SERVER_ERROR));
                    response.json({
                        error: 'Unable to retrieve Somfy scenarios',
                        details: details.message,
                        code: details.code,
                        httpStatus: details.status,
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
};
