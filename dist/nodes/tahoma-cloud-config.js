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
var somfy_cloud_new_auth_1 = require("../core/somfy-cloud-new-auth");
var http_response_enum_1 = require("../enums/http-response.enum");
var REGIONAL_SERVERS = {
    europe: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI',
    america: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI',
    oceania: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI',
};
/**
 * Extract useful diagnostic information from an unknown error.
 *
 * Never deliberately include credentials, access tokens or
 * refresh tokens in logs.
 */
var getErrorDetails = function (error) {
    var _a, _b, _c;
    var err = error;
    return {
        message: (err === null || err === void 0 ? void 0 : err.message) || 'Unknown error',
        code: (err === null || err === void 0 ? void 0 : err.code) || ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error),
        status: (err === null || err === void 0 ? void 0 : err.status) || ((_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.status),
    };
};
/**
 * Return an appropriate HTTP status for an API error.
 */
var getHttpStatus = function (error, fallback) {
    var status = getErrorDetails(error).status;
    if (status && status >= 400 && status <= 599) {
        return status;
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
/**
 * Check whether stored credentials contain a complete OAuth session.
 */
var hasCompleteOAuthSession = function (credentials) {
    return Boolean((credentials === null || credentials === void 0 ? void 0 : credentials.refreshToken) &&
        (credentials === null || credentials === void 0 ? void 0 : credentials.siteOid) &&
        (credentials === null || credentials === void 0 ? void 0 : credentials.gatewayId) &&
        (credentials === null || credentials === void 0 ? void 0 : credentials.oauthRegion));
};
/**
 * Persist the complete OAuth session in Node-RED credentials.
 *
 * Node-RED encrypts credentials at rest.
 *
 * The complete session must be saved together because the
 * refresh token is associated with the selected installation.
 */
var persistOAuthCredentials = function (RED, nodeId, existingCredentials, session) {
    var nodes = RED.nodes;
    if (typeof nodes.addCredentials !== 'function') {
        throw new Error('Node-RED credential persistence is unavailable');
    }
    nodes.addCredentials(nodeId, {
        userId: existingCredentials.userId || '',
        userPassword: existingCredentials.userPassword || '',
        refreshToken: session.refreshToken,
        siteOid: session.siteOid,
        gatewayId: session.gatewayId,
        oauthRegion: session.region,
    });
    existingCredentials.refreshToken = session.refreshToken;
    existingCredentials.siteOid = session.siteOid;
    existingCredentials.gatewayId = session.gatewayId;
    existingCredentials.oauthRegion = session.region;
};
/**
 * Convert an OAuth gateway candidate into the public editor format.
 */
var serializeGateway = function (gateway) { return ({
    gatewayId: gateway.gatewayId,
    homeId: gateway.homeId,
    label: gateway.label,
    country: gateway.country,
    region: gateway.region,
}); };
module.exports = function (RED) {
    RED.nodes.registerType('tahoma-cloud-config', function (props) {
        var _this = this;
        RED.nodes.createNode(this, props);
        var config = props;
        this['name'] = config.name;
        this['region'] = config.region;
        this['authMethod'] = config.authMethod || 'legacy';
        this['gatewayId'] = config.gatewayId || '';
        // Credential access goes here
        var credentials = (this.credentials || {});
        var userId = typeof credentials.userId === 'string' ? credentials.userId : '';
        var userPassword = typeof credentials.userPassword === 'string'
            ? credentials.userPassword
            : '';
        var authMethod = config.authMethod || 'legacy';
        var serverUrl = REGIONAL_SERVERS[config.region];
        var savedGatewayId = config.gatewayId || credentials.gatewayId || undefined;
        /*
         * Shared API instance.
         *
         * OAuth and legacy authentication use the same public
         * SomfyCloudApi interface.
         */
        var api = null;
        var oauthAuth = null;
        /*
         * Configuration lifecycle.
         */
        var closing = false;
        /*
         * Authentication concurrency.
         */
        var authenticated = false;
        var loginPromise = null;
        /*
         * Scenario cache.
         */
        var scenarios = null;
        var scenariosPromise = null;
        /*
         * Authentication initialization.
         */
        if (authMethod === 'oauth') {
            var hasPasswordCredentials = Boolean(userId && userPassword);
            var hasSavedSession = hasCompleteOAuthSession(credentials);
            if (hasPasswordCredentials || hasSavedSession) {
                oauthAuth = new somfy_cloud_new_auth_1.SomfyCloudNewAuth({
                    username: userId || undefined,
                    password: userPassword || undefined,
                    refreshToken: credentials.refreshToken,
                    siteOid: credentials.siteOid,
                    gatewayId: credentials.gatewayId,
                    region: credentials.oauthRegion,
                });
                api = new somfy_cloud_api_1.SomfyCloudApi(oauthAuth);
                /*
                 * Persist every rotated refresh token.
                 *
                 * The OAuth implementation invokes this callback
                 * after receiving a replacement refresh token.
                 */
                oauthAuth.setTokenRefreshCallback(function (session) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (closing) {
                            return [2 /*return*/];
                        }
                        persistOAuthCredentials(RED, this.id, credentials, session);
                        RED.log.info('[TaHoma Cloud] OAuth session credentials updated');
                        return [2 /*return*/];
                    });
                }); });
            }
        }
        else if (serverUrl && userId && userPassword) {
            api = new somfy_cloud_api_1.SomfyCloudApi(userId, userPassword, serverUrl);
        }
        /**
         * Authenticate only when necessary.
         *
         * Concurrent callers share the same login operation.
         */
        var ensureAuthenticated = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!api) {
                    throw new Error('Cloud credentials, authentication method or regional server are missing');
                }
                if (closing) {
                    throw new Error('TaHoma Cloud configuration is closing');
                }
                if (authenticated && api.hasSession()) {
                    return [2 /*return*/];
                }
                if (loginPromise) {
                    return [2 /*return*/, loginPromise];
                }
                loginPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                    var gateways, session, error_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 5, 6, 7]);
                                return [4 /*yield*/, api.login()];
                            case 1:
                                _a.sent();
                                if (closing) {
                                    throw new Error('TaHoma Cloud configuration is closing');
                                }
                                if (!(authMethod === 'oauth' && oauthAuth)) return [3 /*break*/, 4];
                                if (!(savedGatewayId && oauthAuth.gatewayId !== savedGatewayId)) return [3 /*break*/, 3];
                                return [4 /*yield*/, oauthAuth.discoverGateways()];
                            case 2:
                                _a.sent();
                                oauthAuth.selectGateway(savedGatewayId);
                                _a.label = 3;
                            case 3:
                                if (!oauthAuth.hasSelectedGateway) {
                                    gateways = oauthAuth.availableGateways;
                                    if (gateways.length === 1) {
                                        oauthAuth.selectGateway(gateways[0].gatewayId);
                                    }
                                    else {
                                        throw new Error('No Somfy installation is selected. ' +
                                            'Select an installation in the TaHoma Cloud configuration.');
                                    }
                                }
                                session = oauthAuth.toCredentials();
                                persistOAuthCredentials(RED, this.id, credentials, session);
                                _a.label = 4;
                            case 4:
                                authenticated = true;
                                RED.log.info("[TaHoma Cloud] ".concat(authMethod.toUpperCase(), " authentication successful"));
                                return [3 /*break*/, 7];
                            case 5:
                                error_1 = _a.sent();
                                authenticated = false;
                                throw error_1;
                            case 6:
                                loginPromise = null;
                                return [7 /*endfinally*/];
                            case 7: return [2 /*return*/];
                        }
                    });
                }); })();
                return [2 /*return*/, loginPromise];
            });
        }); };
        /**
         * Retrieve scenarios from Somfy Cloud.
         *
         * A failed authentication request can be retried once
         * because retrieving scenarios does not execute actions.
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
                        RED.log.warn('[TaHoma Cloud] Authentication error while retrieving scenarios. Re-authenticating.');
                        authenticated = false;
                        return [4 /*yield*/, ensureAuthenticated()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, api.getActionGroups()];
                    case 6: return [2 /*return*/, (_a.sent()).map(function (group) { return ({
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
         * The cache is replaced only after successful retrieval.
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
         * Execute a scenario.
         *
         * Never automatically retry scenario execution.
         */
        var executeScenario = function (scenarioId) { return __awaiter(_this, void 0, void 0, function () {
            var execution, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!api) {
                            throw new Error('Cloud credentials or regional server are missing');
                        }
                        if (!scenarioId ||
                            typeof scenarioId !== 'string' ||
                            !scenarioId.trim()) {
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
                            authenticated = false;
                            api.invalidateSession();
                            RED.log.warn('[TaHoma Cloud] Authentication error during scenario execution. ' +
                                'The execution was not automatically retried.');
                        }
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        /*
         * Public configuration-node API.
         */
        this['getScenarios'] = function () {
            return retrieveScenarios(false);
        };
        this['refreshScenarios'] = function () {
            return retrieveScenarios(true);
        };
        this['executeScenario'] = function (scenarioId) { return executeScenario(scenarioId); };
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
        this['isScenarioCacheReady'] = function () { return scenarios !== null; };
        /*
         * Backward compatibility.
         *
         * Returns the shared API instance.
         * Callers must not independently log in or log out.
         */
        this['createApi'] = api ? function () { return api; } : null;
        /*
         * Expose the selected authentication method for
         * other nodes that need to inspect configuration.
         */
        this['getAuthMethod'] = function () { return authMethod; };
        /*
         * Initial scenario discovery.
         */
        if (api) {
            retrieveScenarios().catch(function () {
                RED.log.warn('[TaHoma Cloud] Initial scenario discovery failed. ' +
                    'Scenarios can be retrieved later using Refresh scenarios.');
            });
        }
        else {
            RED.log.warn("[TaHoma Cloud] Initialization skipped: ".concat(authMethod, " credentials or configuration are missing."));
        }
        /*
         * Shutdown.
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
            refreshToken: { type: 'password' },
            siteOid: { type: 'text' },
            gatewayId: { type: 'text' },
            oauthRegion: { type: 'text' },
        },
    });
    // Block 2 continues here with the HTTP admin endpoints.
    /**
     * Test Somfy Cloud connection.
     *
     * Supports both legacy and OAuth authentication.
     *
     * OAuth testing:
     * - Discovers installations.
     * - Validates the selected installation.
     * - Supports an existing refresh-token session.
     */
    RED.httpAdmin.post('/somfy/cloud/test', function (request, response) { return __awaiter(void 0, void 0, void 0, function () {
        var body, configNodeId, submittedUserId, submittedPassword, region, gatewayId, authMethod, configNode, storedCredentials, userId, userPassword, hasStoredOAuthSession, testApi, testAuth, authenticated, gateways, actionGroups_1, session, serverUrl, actionGroups, error_5, details, status_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = (request.body || {});
                    configNodeId = body.configNodeId, submittedUserId = body.userId, submittedPassword = body.userPassword, region = body.region, gatewayId = body.gatewayId;
                    authMethod = body.authMethod || 'legacy';
                    configNode = configNodeId
                        ? RED.nodes.getNode(configNodeId)
                        : null;
                    storedCredentials = configNode === null || configNode === void 0 ? void 0 : configNode.credentials;
                    userId = submittedUserId || (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.userId);
                    userPassword = submittedPassword || (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.userPassword);
                    hasStoredOAuthSession = typeof (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.refreshToken) === 'string' &&
                        Boolean(storedCredentials.refreshToken) &&
                        typeof (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.siteOid) === 'string' &&
                        Boolean(storedCredentials.siteOid) &&
                        typeof (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.gatewayId) === 'string' &&
                        Boolean(storedCredentials.gatewayId) &&
                        typeof (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.oauthRegion) === 'string' &&
                        Boolean(storedCredentials.oauthRegion);
                    if (authMethod === 'legacy' && (!userId || !userPassword)) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            success: false,
                            error: 'Missing Somfy email or password',
                        });
                        return [2 /*return*/];
                    }
                    if (authMethod === 'oauth' &&
                        (!userId || !userPassword) &&
                        !hasStoredOAuthSession) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            success: false,
                            error: 'Somfy email and password, or a valid stored OAuth session, are required',
                        });
                        return [2 /*return*/];
                    }
                    testApi = null;
                    testAuth = null;
                    authenticated = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, 9, 10]);
                    if (!(authMethod === 'oauth')) return [3 /*break*/, 5];
                    testAuth = new somfy_cloud_new_auth_1.SomfyCloudNewAuth({
                        username: userId,
                        password: userPassword,
                        refreshToken: storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.refreshToken,
                        siteOid: storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.siteOid,
                        gatewayId: gatewayId || (storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.gatewayId),
                        region: storedCredentials === null || storedCredentials === void 0 ? void 0 : storedCredentials.oauthRegion,
                    });
                    testApi = new somfy_cloud_api_1.SomfyCloudApi(testAuth);
                    return [4 /*yield*/, testApi.login()];
                case 2:
                    _a.sent();
                    authenticated = true;
                    /*
                     * Explicitly discover installations.
                     *
                     * This is important when restoring a previously
                     * persisted OAuth session, because login may restore
                     * the selected session without performing discovery.
                     */
                    return [4 /*yield*/, testAuth.discoverGateways()];
                case 3:
                    /*
                     * Explicitly discover installations.
                     *
                     * This is important when restoring a previously
                     * persisted OAuth session, because login may restore
                     * the selected session without performing discovery.
                     */
                    _a.sent();
                    gateways = testAuth.availableGateways.map(serializeGateway);
                    /*
                     * Return discovered installations when no gateway
                     * has yet been selected.
                     */
                    if (!gatewayId && !testAuth.hasSelectedGateway) {
                        response.json({
                            success: true,
                            authenticated: true,
                            gateways: gateways,
                            scenarioCount: 0,
                            message: 'Installations discovered',
                        });
                        return [2 /*return*/];
                    }
                    if (gatewayId) {
                        testAuth.selectGateway(gatewayId);
                    }
                    if (!testAuth.hasSelectedGateway) {
                        response.json({
                            success: true,
                            authenticated: true,
                            gateways: gateways,
                            scenarioCount: 0,
                            message: 'Please select a Somfy installation',
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, testApi.getActionGroups()];
                case 4:
                    actionGroups_1 = _a.sent();
                    session = testAuth.toCredentials();
                    response.json({
                        success: true,
                        authenticated: true,
                        gateways: gateways,
                        selectedGateway: session.gatewayId,
                        siteOid: session.siteOid,
                        region: session.region,
                        scenarioCount: actionGroups_1.length,
                    });
                    RED.log.info("[TaHoma Cloud Test] OAuth connection successful. " +
                        "".concat(actionGroups_1.length, " scenarios discovered."));
                    return [2 /*return*/];
                case 5:
                    serverUrl = REGIONAL_SERVERS[region || 'europe'];
                    if (!serverUrl) {
                        response.status(http_response_enum_1.HttpResponse.BAD_REQUEST);
                        response.json({
                            success: false,
                            error: 'Invalid regional server',
                        });
                        return [2 /*return*/];
                    }
                    testApi = new somfy_cloud_api_1.SomfyCloudApi(userId, userPassword, serverUrl);
                    return [4 /*yield*/, testApi.login()];
                case 6:
                    _a.sent();
                    authenticated = true;
                    return [4 /*yield*/, testApi.getActionGroups()];
                case 7:
                    actionGroups = _a.sent();
                    response.json({
                        success: true,
                        authenticated: true,
                        scenarioCount: actionGroups.length,
                    });
                    RED.log.info("[TaHoma Cloud Test] Legacy connection successful. " +
                        "".concat(actionGroups.length, " scenarios discovered."));
                    return [3 /*break*/, 10];
                case 8:
                    error_5 = _a.sent();
                    details = getErrorDetails(error_5);
                    RED.log.error("[TaHoma Cloud Test] ".concat(authMethod, " connection failed. ") +
                        "Message: ".concat(details.message, ", ") +
                        "HTTP status: ".concat(details.status || 'N/A', ", ") +
                        "Code: ".concat(details.code || 'N/A'));
                    status_1 = getHttpStatus(error_5, authenticated ? http_response_enum_1.HttpResponse.SERVER_ERROR : http_response_enum_1.HttpResponse.UNAUTHORIZED);
                    if (!response.headersSent) {
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
                    }
                    return [3 /*break*/, 10];
                case 9:
                    if (testApi) {
                        safeLogout(testApi);
                    }
                    else if (testAuth) {
                        testAuth.logout();
                    }
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    /**
     * Retrieve scenarios for an existing configuration node.
     *
     * Normal requests use the shared cache.
     * ?refresh=true forces a cloud retrieval.
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
