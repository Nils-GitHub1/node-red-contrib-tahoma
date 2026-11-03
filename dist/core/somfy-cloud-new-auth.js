"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SomfyCloudNewAuth = exports.SomfyNoGatewaySelectedError = exports.SomfyBadCredentialsError = exports.SomfyAuthError = void 0;
var axios_1 = require("axios");
/*
 * Somfy OAuth implementation.
 *
 * Adapted from the Python OAuth implementation in:
 * https://github.com/iMicknl/python-overkiz-api
 *
 * Original copyright: Copyright (c) 2020 Mick Vleeshouwer
 *
 * Original license: MIT
 *
 * Translated and adapted for @Nils-GitHub1/node-red-contrib-tahoma.
 */
/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */
var SOMFY_API = 'https://accounts.somfy.com';
var SOMFY_GINAITE_TOKEN_URL = 'https://ginaite-prod.ovkube.net/realms/somfy-tahoma/protocol/openid-connect/token';
var SOMFY_GINAITE_SUBJECT_ISSUER = 'somfy-customer';
var SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange';
var SOMFY_GINAITE_SUBJECT_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:access_token';
var SOMFY_BOB_SITE_API = 'https://backoffice-service.ovkube.net/site-api/public/v1';
/*
 * Somfy OAuth application constants.
 *
 * These values are taken from the public pyOverkiz implementation.
 * They are application identifiers, not Node-RED user credentials.
 */
var SOMFY_CLIENT_ID = '0d8e920c-1478-11e7-a377-02dd59bd3041_1ewvaqmclfogo4kcsoo0c8k4kso884owg08sg8c40sk4go4ksg';
var SOMFY_CLIENT_SECRET = '12k73w1n540g8o4cokg0cw84cog840k84cwggscwg884004kgk';
var SOMFY_BOB_API_KEY = '184638B3FBE874ACD24C14FBD657B';
var SOMFY_BOB_PAGE_SIZE = 20;
var SOMFY_BOB_MAX_SITES = 200;
var TOKEN_EXPIRY_MARGIN_MS = 30000;
var FALLBACK_TOKEN_LIFETIME_MS = 5 * 60 * 1000;
var DEFAULT_REGION = 'EMEA';
/* -------------------------------------------------------------------------- */
/* Regional endpoints                                                         */
/* -------------------------------------------------------------------------- */
var REGION_ENDPOINTS = {
    EMEA: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI/',
    APAC: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI/',
    SNABA: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI/',
};
/* -------------------------------------------------------------------------- */
/* Country mapping                                                            */
/* -------------------------------------------------------------------------- */
var COUNTRY_REGIONS = {};
var addCountries = function (region, countries) {
    for (var _i = 0, _a = countries.split(/\s+/); _i < _a.length; _i++) {
        var country = _a[_i];
        if (country) {
            COUNTRY_REGIONS[country] = region;
        }
    }
};
addCountries('SNABA', 'CA US MX');
addCountries('APAC', 'AU HK IN ID JP MY NZ PH SG TW TH VN KR CN');
addCountries('EMEA', "\n  AL AD AT BY BE BG HR CY CZ DK EG EE FO FI FR GF PF DE GR GP HU\n  IL IT JE JO KZ KW LV LB LT LU MQ YT MC MA NL NO NC PS PL PT QA\n  IE RE RO RU BL SA RS SK ZA ES SE CH TN TR UA AE GB AM AO AZ BA\n  BH CI CM DZ ET GE GG GH GI IM IQ IS KE KG LI LY MD ME MG MK MT\n  MU NA NG OM SI SM SN TZ UG UZ VA ZM ZW\n  ");
/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */
var SomfyAuthError = /** @class */ (function (_super) {
    __extends(SomfyAuthError, _super);
    function SomfyAuthError(message, status, code) {
        var _this = _super.call(this, message) || this;
        _this.name = 'SomfyAuthError';
        _this.status = status;
        _this.code = code;
        Object.setPrototypeOf(_this, SomfyAuthError.prototype);
        return _this;
    }
    return SomfyAuthError;
}(Error));
exports.SomfyAuthError = SomfyAuthError;
var SomfyBadCredentialsError = /** @class */ (function (_super) {
    __extends(SomfyBadCredentialsError, _super);
    function SomfyBadCredentialsError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'SomfyBadCredentialsError';
        Object.setPrototypeOf(_this, SomfyBadCredentialsError.prototype);
        return _this;
    }
    return SomfyBadCredentialsError;
}(SomfyAuthError));
exports.SomfyBadCredentialsError = SomfyBadCredentialsError;
var SomfyNoGatewaySelectedError = /** @class */ (function (_super) {
    __extends(SomfyNoGatewaySelectedError, _super);
    function SomfyNoGatewaySelectedError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'SomfyNoGatewaySelectedError';
        Object.setPrototypeOf(_this, SomfyNoGatewaySelectedError.prototype);
        return _this;
    }
    return SomfyNoGatewaySelectedError;
}(SomfyAuthError));
exports.SomfyNoGatewaySelectedError = SomfyNoGatewaySelectedError;
/* -------------------------------------------------------------------------- */
/* Main authentication class                                                  */
/* -------------------------------------------------------------------------- */
var SomfyCloudNewAuth = /** @class */ (function () {
    function SomfyCloudNewAuth(options) {
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = 0;
        this.tokenSiteOid = null;
        this.gateways = [];
        this.selectedSiteOid = null;
        this.selectedGatewayId = null;
        this.selectedRegion = null;
        this.selectedEndpoint = null;
        this.refreshPromise = null;
        this.loginPromise = null;
        /**
         * Tracks the complete persisted session, not just the refresh token.
         *
         * This ensures that changes to the selected installation are also
         * persisted when the next site-scoped refresh takes place.
         */
        this.persistedSessionKey = null;
        this.loggedIn = false;
        this.closed = false;
        this.username = options.username;
        this.password = options.password;
        this.refreshToken = options.refreshToken || null;
        this.persistedSessionKey =
            options.refreshToken &&
                options.siteOid &&
                options.gatewayId &&
                options.region
                ? this.sessionKey({
                    refreshToken: options.refreshToken,
                    siteOid: options.siteOid,
                    gatewayId: options.gatewayId,
                    region: options.region,
                })
                : null;
        this.selectedSiteOid = options.siteOid || null;
        this.selectedGatewayId = options.gatewayId || null;
        this.selectedRegion = options.region || null;
        if (this.selectedRegion) {
            var endpoint = REGION_ENDPOINTS[this.selectedRegion];
            if (!endpoint) {
                throw new SomfyAuthError("Unknown Somfy region: ".concat(this.selectedRegion));
            }
            this.selectedEndpoint = endpoint;
        }
        this.axiosInstance = axios_1.default.create({
            timeout: 20000,
            headers: {
                Accept: 'application/json',
            },
        });
    }
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */
    /**
     * Authenticate using either:
     *
     * 1. A restored refresh-token session.
     * 2. A fresh Somfy username/password login.
     *
     * Concurrent login calls share one Promise.
     */
    SomfyCloudNewAuth.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.closed) {
                    throw new SomfyAuthError('Somfy authentication instance is closed');
                }
                if (this.loginPromise) {
                    return [2 /*return*/, this.loginPromise];
                }
                this.loginPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                    var existingGateway, error_1;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 4, 5, 6]);
                                /*
                                 * Restore an existing complete session.
                                 */
                                if (this.refreshToken &&
                                    this.selectedSiteOid &&
                                    this.selectedGatewayId &&
                                    this.selectedRegion) {
                                    this.loggedIn = true;
                                    this.expiresAt = 0;
                                    return [2 /*return*/];
                                }
                                /*
                                 * Fresh password authentication.
                                 */
                                if (!this.username || !this.password) {
                                    throw new SomfyBadCredentialsError('Somfy username and password are required for a fresh login');
                                }
                                return [4 /*yield*/, this.performPasswordGrant()];
                            case 1:
                                _a.sent();
                                if (!this.accessToken) {
                                    throw new SomfyAuthError('Somfy password grant did not return an access token');
                                }
                                /*
                                 * Exchange the Somfy Accounts token for a Ginaite token.
                                 */
                                return [4 /*yield*/, this.performGinaiteTokenExchange(this.accessToken)];
                            case 2:
                                /*
                                 * Exchange the Somfy Accounts token for a Ginaite token.
                                 */
                                _a.sent();
                                if (!this.accessToken) {
                                    throw new SomfyAuthError('Ginaite token exchange did not return an access token');
                                }
                                this.loggedIn = true;
                                /*
                                 * Discover all installations.
                                 */
                                return [4 /*yield*/, this.discoverGateways()];
                            case 3:
                                /*
                                 * Discover all installations.
                                 */
                                _a.sent();
                                /*
                                 * Automatically select the only available installation.
                                 */
                                if (!this.selectedGatewayId && this.gateways.length === 1) {
                                    this.selectGateway(this.gateways[0].gatewayId);
                                }
                                else if (this.selectedGatewayId) {
                                    existingGateway = this.gateways.find(function (gateway) { return gateway.gatewayId === _this.selectedGatewayId; });
                                    if (existingGateway) {
                                        this.selectGateway(existingGateway.gatewayId);
                                    }
                                    else {
                                        this.selectedGatewayId = null;
                                        this.selectedSiteOid = null;
                                        this.selectedRegion = null;
                                        this.selectedEndpoint = null;
                                    }
                                }
                                return [3 /*break*/, 6];
                            case 4:
                                error_1 = _a.sent();
                                this.loggedIn = false;
                                throw error_1;
                            case 5:
                                this.loginPromise = null;
                                return [7 /*endfinally*/];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); })();
                return [2 /*return*/, this.loginPromise];
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* Somfy password authentication                                          */
    /* ---------------------------------------------------------------------- */
    SomfyCloudNewAuth.prototype.performPasswordGrant = function () {
        return __awaiter(this, void 0, void 0, function () {
            var body, response, error_2, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = new URLSearchParams();
                        body.append('grant_type', 'password');
                        body.append('client_id', SOMFY_CLIENT_ID);
                        body.append('client_secret', SOMFY_CLIENT_SECRET);
                        body.append('username', this.username);
                        body.append('password', this.password);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.axiosInstance.post("".concat(SOMFY_API, "/oauth/oauth/v2/token/jwt"), body.toString(), {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        throw this.mapHttpError(error_2, 'Somfy password authentication failed');
                    case 4:
                        token = response.data;
                        if (token.message === 'error.invalid.grant' ||
                            token.error === 'invalid_grant') {
                            throw new SomfyBadCredentialsError('Invalid Somfy username or password');
                        }
                        this.updateToken(token);
                        if (!this.accessToken) {
                            throw new SomfyAuthError('Somfy password grant returned no access token');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* Ginaite token exchange                                                 */
    /* ---------------------------------------------------------------------- */
    SomfyCloudNewAuth.prototype.performGinaiteTokenExchange = function (ssoAccessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var body, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        body = new URLSearchParams();
                        body.append('grant_type', SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT);
                        body.append('client_id', SOMFY_CLIENT_ID);
                        body.append('subject_token', ssoAccessToken);
                        body.append('subject_issuer', SOMFY_GINAITE_SUBJECT_ISSUER);
                        body.append('subject_token_type', SOMFY_GINAITE_SUBJECT_TOKEN_TYPE);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.axiosInstance.post(SOMFY_GINAITE_TOKEN_URL, body.toString(), {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        throw this.mapHttpError(error_3, 'Somfy Ginaite token exchange failed');
                    case 4:
                        this.updateToken(response.data);
                        this.tokenSiteOid = null;
                        if (!this.accessToken) {
                            throw new SomfyAuthError('Ginaite token exchange returned no access token');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* BOB gateway discovery                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     * Discover all Somfy installations associated with the account.
     *
     * BOB requires an account-wide Ginaite token.
     * Results are retrieved using pagination.
     */
    SomfyCloudNewAuth.prototype.discoverGateways = function () {
        return __awaiter(this, void 0, void 0, function () {
            var candidates, sitesSeen, totalCount, offset, data, page, results, _i, results_1, site, siteOid, region, subSites, _a, subSites_1, subSite, gateway, roles;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.ensureAccountToken()];
                    case 1:
                        _c.sent();
                        candidates = [];
                        sitesSeen = 0;
                        totalCount = 0;
                        offset = 0;
                        _c.label = 2;
                    case 2:
                        if (!(offset < SOMFY_BOB_MAX_SITES)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.bobGet("sites?withGateways=true&limit=".concat(SOMFY_BOB_PAGE_SIZE, "&offset=").concat(offset))];
                    case 3:
                        data = _c.sent();
                        page = data;
                        results = Array.isArray(page.results) ? page.results : [];
                        totalCount = Number(page.totalCount || 0);
                        sitesSeen += results.length;
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            site = results_1[_i];
                            siteOid = site.siteOID;
                            if (!siteOid) {
                                continue;
                            }
                            region = this.regionForCountry(site.country);
                            subSites = site.subSites || [];
                            for (_a = 0, subSites_1 = subSites; _a < subSites_1.length; _a++) {
                                subSite = subSites_1[_a];
                                gateway = (_b = subSite.gateways) === null || _b === void 0 ? void 0 : _b[0];
                                if (!(gateway === null || gateway === void 0 ? void 0 : gateway.gatewayId)) {
                                    continue;
                                }
                                roles = site.currentUserRoles || site.roles || [];
                                candidates.push({
                                    gatewayId: gateway.gatewayId,
                                    homeId: siteOid,
                                    label: site.name || siteOid,
                                    externalId: subSite.externalOID || subSite.externalId,
                                    country: site.country,
                                    region: region,
                                    roles: roles
                                        .map(function (role) { return role.roleOID; })
                                        .filter(function (role) { return typeof role === 'string'; }),
                                });
                            }
                        }
                        if (results.length === 0 || sitesSeen >= totalCount) {
                            return [3 /*break*/, 5];
                        }
                        _c.label = 4;
                    case 4:
                        offset += SOMFY_BOB_PAGE_SIZE;
                        return [3 /*break*/, 2];
                    case 5:
                        if (sitesSeen < totalCount) {
                            console.warn("[Somfy OAuth] BOB returned ".concat(sitesSeen, " of ").concat(totalCount, " sites. ") +
                                'The maximum discovery limit was reached.');
                        }
                        this.gateways = candidates;
                        return [2 /*return*/, this.availableGateways];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* BOB API requests                                                       */
    /* ---------------------------------------------------------------------- */
    SomfyCloudNewAuth.prototype.bobGet = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.accessToken) {
                            throw new SomfyAuthError('No Ginaite access token available for BOB');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.axiosInstance.get("".concat(SOMFY_BOB_SITE_API, "/").concat(path), {
                                headers: {
                                    Authorization: "Bearer ".concat(this.accessToken),
                                    'X-Api-Key': SOMFY_BOB_API_KEY,
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                    case 3:
                        error_4 = _a.sent();
                        throw this.mapHttpError(error_4, 'Somfy BOB site discovery failed');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* Account-wide token                                                     */
    /* ---------------------------------------------------------------------- */
    /**
     * Ensure that an account-wide token is available.
     *
     * This token is used exclusively for BOB discovery.
     */
    SomfyCloudNewAuth.prototype.ensureAccountToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.accessToken && !this.isExpired() && this.tokenSiteOid === null) {
                            return [2 /*return*/];
                        }
                        if (!this.refreshToken) {
                            throw new SomfyAuthError('Cannot discover Somfy sites without a refresh token');
                        }
                        return [4 /*yield*/, this.refreshTokenWithLock(null)];
                    case 1:
                        _a.sent();
                        /*
                         * Do not accidentally reuse the account-wide token
                         * for a subsequent regional API request.
                         */
                        if (this.selectedSiteOid) {
                            this.expiresAt = 0;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* Gateway selection                                                      */
    /* ---------------------------------------------------------------------- */
    /**
     * Select a gateway and its corresponding installation.
     */
    SomfyCloudNewAuth.prototype.selectGateway = function (gatewayId) {
        if (!gatewayId || typeof gatewayId !== 'string') {
            throw new SomfyNoGatewaySelectedError('A valid Somfy gateway ID is required');
        }
        var gateway = this.gateways.find(function (candidate) { return candidate.gatewayId === gatewayId; });
        if (!gateway) {
            throw new SomfyAuthError("Unknown Somfy gateway ID: ".concat(gatewayId));
        }
        var endpoint = REGION_ENDPOINTS[gateway.region];
        if (!endpoint) {
            throw new SomfyAuthError("No API endpoint configured for region ".concat(gateway.region));
        }
        var selectionChanged = this.selectedGatewayId !== gateway.gatewayId ||
            this.selectedSiteOid !== gateway.homeId ||
            this.selectedRegion !== gateway.region;
        this.selectedGatewayId = gateway.gatewayId;
        this.selectedSiteOid = gateway.homeId;
        this.selectedRegion = gateway.region;
        this.selectedEndpoint = endpoint;
        if (selectionChanged) {
            /*
             * Force a site-scoped token refresh.
             *
             * The next successful refresh will also persist
             * the complete newly selected session.
             */
            this.expiresAt = 0;
        }
    };
    /* ---------------------------------------------------------------------- */
    /* Regional resolution                                                    */
    /* ---------------------------------------------------------------------- */
    SomfyCloudNewAuth.prototype.regionForCountry = function (country) {
        var code = country === null || country === void 0 ? void 0 : country.toUpperCase();
        var region = code ? COUNTRY_REGIONS[code] : undefined;
        if (!region) {
            console.warn("[Somfy OAuth] Unknown country \"".concat(country, "\". ") +
                "Using ".concat(DEFAULT_REGION, "."));
            return DEFAULT_REGION;
        }
        return region;
    };
    /* ---------------------------------------------------------------------- */
    /* Token expiration                                                       */
    /* ---------------------------------------------------------------------- */
    SomfyCloudNewAuth.prototype.isExpired = function () {
        if (!this.accessToken || !this.expiresAt) {
            return true;
        }
        return Date.now() + TOKEN_EXPIRY_MARGIN_MS >= this.expiresAt;
    };
    /**
     * Refresh the token when necessary.
     */
    SomfyCloudNewAuth.prototype.refreshIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isExpired()) return [3 /*break*/, 2];
                        /*
                         * Also retry persistence if an earlier persistence
                         * callback failed after the token was refreshed.
                         */
                        return [4 /*yield*/, this.notifyTokenRefresh()];
                    case 1:
                        /*
                         * Also retry persistence if an earlier persistence
                         * callback failed after the token was refreshed.
                         */
                        _a.sent();
                        return [2 /*return*/, false];
                    case 2:
                        if (!this.refreshToken) {
                            if (this.selectedSiteOid) {
                                throw new SomfyAuthError('Cannot generate a site-scoped token without a refresh token');
                            }
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.refreshTokenWithLock(this.selectedSiteOid)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Invalidate the current access token without deleting
     * the refresh token or the selected installation.
     *
     * This is used when Somfy rejects an access token
     * before its locally calculated expiration time.
     */
    SomfyCloudNewAuth.prototype.invalidateAccessToken = function () {
        this.accessToken = null;
        this.expiresAt = 0;
        this.tokenSiteOid = null;
    };
    /* ---------------------------------------------------------------------- */
    /* Serialized token refresh                                               */
    /* ---------------------------------------------------------------------- */
    /**
     * Serialize refresh operations.
     *
     * A refresh operation for one scope must finish before
     * another scope can start.
     */
    SomfyCloudNewAuth.prototype.refreshTokenWithLock = function (siteOid) {
        return __awaiter(this, void 0, void 0, function () {
            var refreshOperation;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 7];
                        if (this.closed) {
                            throw new SomfyAuthError('Somfy authentication instance is closed');
                        }
                        if (!this.refreshPromise) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.refreshPromise];
                    case 1:
                        _a.sent();
                        if (!this.isExpired() && this.tokenSiteOid === siteOid) {
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 0];
                    case 2:
                        if (!this.isExpired() && this.tokenSiteOid === siteOid) {
                            return [2 /*return*/];
                        }
                        refreshOperation = this.performRefresh(siteOid);
                        this.refreshPromise = refreshOperation;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, refreshOperation];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        /*
                         * Only clear the Promise belonging to this operation.
                         */
                        if (this.refreshPromise === refreshOperation) {
                            this.refreshPromise = null;
                        }
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* Ginaite refresh grant                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     * Perform a refresh-token grant.
     *
     * siteOid:
     *   null = account-wide token.
     *   value = installation-scoped token.
     */
    SomfyCloudNewAuth.prototype.performRefresh = function (siteOid) {
        return __awaiter(this, void 0, void 0, function () {
            var previousRefreshToken, url, body, response, error_5, axiosError, token;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.refreshToken) {
                            throw new SomfyAuthError('No Somfy refresh token available');
                        }
                        previousRefreshToken = this.refreshToken;
                        url = SOMFY_GINAITE_TOKEN_URL;
                        if (siteOid) {
                            url += "?siteOID=".concat(encodeURIComponent(siteOid));
                        }
                        body = new URLSearchParams();
                        body.append('grant_type', 'refresh_token');
                        body.append('client_id', SOMFY_CLIENT_ID);
                        body.append('refresh_token', previousRefreshToken);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.axiosInstance.post(url, body.toString(), {
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            })];
                    case 2:
                        response = _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _c.sent();
                        axiosError = error_5;
                        if (((_b = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === 'invalid_grant') {
                            throw new SomfyBadCredentialsError(axiosError.response.data.error_description ||
                                'Somfy refresh token has been revoked');
                        }
                        throw this.mapHttpError(error_5, 'Somfy token refresh failed');
                    case 4:
                        token = response.data;
                        /*
                         * Reject incomplete responses.
                         *
                         * Never retain an old access token as if the refresh
                         * operation had succeeded.
                         */
                        if (!token.access_token) {
                            throw new SomfyAuthError('Somfy token refresh returned no access token');
                        }
                        /*
                         * Preserve the previous refresh token when Ginaite
                         * does not return a replacement.
                         */
                        if (!token.refresh_token) {
                            token.refresh_token = previousRefreshToken;
                        }
                        /*
                         * Update the tokens and scope.
                         */
                        this.updateToken(token);
                        this.tokenSiteOid = siteOid;
                        /*
                         * Persist the complete session before reporting
                         * a successful site-scoped refresh.
                         *
                         * If persistence fails, the operation rejects.
                         * The valid in-memory token is retained, and the next
                         * request retries persistence before using that token.
                         */
                        return [4 /*yield*/, this.notifyTokenRefresh()];
                    case 5:
                        /*
                         * Persist the complete session before reporting
                         * a successful site-scoped refresh.
                         *
                         * If persistence fails, the operation rejects.
                         * The valid in-memory token is retained, and the next
                         * request retries persistence before using that token.
                         */
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* Session persistence                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     * Build a stable comparison key for a complete session.
     */
    SomfyCloudNewAuth.prototype.sessionKey = function (session) {
        return JSON.stringify([
            session.refreshToken,
            session.siteOid,
            session.gatewayId,
            session.region,
        ]);
    };
    /**
     * Persist the complete OAuth session.
     *
     * Changes to either the refresh token or the selected
     * installation cause persistence.
     */
    SomfyCloudNewAuth.prototype.notifyTokenRefresh = function () {
        return __awaiter(this, void 0, void 0, function () {
            var session, currentKey, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.refreshToken) {
                            return [2 /*return*/];
                        }
                        /*
                         * An account-wide token can exist before selection.
                         * It cannot yet be exported as an installation session.
                         */
                        if (!this.selectedSiteOid ||
                            !this.selectedGatewayId ||
                            !this.selectedRegion) {
                            return [2 /*return*/];
                        }
                        session = this.getSession();
                        currentKey = this.sessionKey(session);
                        if (currentKey === this.persistedSessionKey) {
                            return [2 /*return*/];
                        }
                        if (!this.tokenRefreshCallback) {
                            throw new SomfyAuthError('The OAuth session changed but no Node-RED persistence callback is configured.', undefined, 'SESSION_PERSISTENCE_UNAVAILABLE');
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tokenRefreshCallback(session)];
                    case 2:
                        _b.sent();
                        /*
                         * Only mark the session persisted after successful
                         * completion of the Node-RED callback.
                         */
                        this.persistedSessionKey = currentKey;
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        throw new SomfyAuthError('Somfy authentication was refreshed, but the updated session could not be persisted. ' +
                            'Check Node-RED credential storage before retrying.', undefined, 'SESSION_PERSISTENCE_FAILED');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Register the Node-RED session persistence callback.
     */
    SomfyCloudNewAuth.prototype.setTokenRefreshCallback = function (callback) {
        this.tokenRefreshCallback = callback;
    };
    /**
     * Return the complete selected installation session.
     */
    SomfyCloudNewAuth.prototype.getSession = function () {
        if (!this.refreshToken ||
            !this.selectedSiteOid ||
            !this.selectedGatewayId ||
            !this.selectedRegion) {
            throw new SomfyAuthError('Cannot export an incomplete Somfy OAuth session');
        }
        return {
            refreshToken: this.refreshToken,
            siteOid: this.selectedSiteOid,
            gatewayId: this.selectedGatewayId,
            region: this.selectedRegion,
        };
    };
    /**
     * Export credentials for Node-RED.
     *
     * The access token is deliberately never persisted.
     */
    SomfyCloudNewAuth.prototype.toCredentials = function () {
        return this.getSession();
    };
    /* ---------------------------------------------------------------------- */
    /* Authentication headers                                                */
    /* ---------------------------------------------------------------------- */
    /**
     * Return authorization headers for the selected installation.
     *
     * A valid site-scoped access token is obtained automatically.
     */
    SomfyCloudNewAuth.prototype.getHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureSiteToken()];
                    case 1:
                        _a.sent();
                        if (!this.accessToken) {
                            throw new SomfyAuthError('No Somfy access token available');
                        }
                        return [2 /*return*/, {
                                Authorization: "Bearer ".concat(this.accessToken),
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            }];
                }
            });
        });
    };
    /**
     * Ensure a valid token scoped to the selected installation.
     */
    SomfyCloudNewAuth.prototype.ensureSiteToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.closed) {
                            throw new SomfyAuthError('Somfy authentication instance is closed');
                        }
                        if (!this.selectedSiteOid || !this.selectedGatewayId) {
                            throw new SomfyNoGatewaySelectedError('No Somfy gateway has been selected');
                        }
                        if (!this.selectedRegion || !this.selectedEndpoint) {
                            throw new SomfyAuthError('No regional Somfy API endpoint is configured');
                        }
                        if (!(!this.isExpired() && this.tokenSiteOid === this.selectedSiteOid)) return [3 /*break*/, 2];
                        /*
                         * Important:
                         * A previous persistence failure must not result
                         * in an unpersisted token being silently accepted.
                         */
                        return [4 /*yield*/, this.notifyTokenRefresh()];
                    case 1:
                        /*
                         * Important:
                         * A previous persistence failure must not result
                         * in an unpersisted token being silently accepted.
                         */
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (!this.refreshToken) {
                            throw new SomfyAuthError('No Somfy refresh token available');
                        }
                        return [4 /*yield*/, this.refreshTokenWithLock(this.selectedSiteOid)];
                    case 3:
                        _a.sent();
                        if (!this.accessToken ||
                            this.isExpired() ||
                            this.tokenSiteOid !== this.selectedSiteOid) {
                            throw new SomfyAuthError('Unable to obtain a valid Somfy site-scoped access token');
                        }
                        /*
                         * Ensure persistence has completed before returning.
                         */
                        return [4 /*yield*/, this.notifyTokenRefresh()];
                    case 4:
                        /*
                         * Ensure persistence has completed before returning.
                         */
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(SomfyCloudNewAuth.prototype, "endpoint", {
        /* ---------------------------------------------------------------------- */
        /* Public properties                                                      */
        /* ---------------------------------------------------------------------- */
        /**
         * Return the selected regional API endpoint.
         */
        get: function () {
            if (!this.selectedEndpoint) {
                throw new SomfyNoGatewaySelectedError('No Somfy gateway has been selected');
            }
            return this.selectedEndpoint;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "siteOid", {
        /**
         * Return the selected site OID.
         */
        get: function () {
            return this.selectedSiteOid;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "gatewayId", {
        /**
         * Return the selected gateway ID.
         */
        get: function () {
            return this.selectedGatewayId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "region", {
        /**
         * Return the selected region.
         */
        get: function () {
            return this.selectedRegion;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "availableGateways", {
        /**
         * Return available gateways.
         *
         * Return copies to prevent external modification.
         */
        get: function () {
            return this.gateways.map(function (gateway) { return (__assign(__assign({}, gateway), { roles: __spreadArray([], gateway.roles, true) })); });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Return whether authentication has been initialized.
     */
    SomfyCloudNewAuth.prototype.isAuthenticated = function () {
        return this.loggedIn && !this.closed;
    };
    /**
     * Compatibility method used by SomfyCloudApi.
     */
    SomfyCloudNewAuth.prototype.getAuthHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getHeaders()];
            });
        });
    };
    Object.defineProperty(SomfyCloudNewAuth.prototype, "hasSelectedGateway", {
        /**
         * Return whether a gateway has been selected.
         */
        get: function () {
            return Boolean(this.selectedGatewayId && this.selectedSiteOid && this.selectedEndpoint);
        },
        enumerable: false,
        configurable: true
    });
    /* ---------------------------------------------------------------------- */
    /* Token management                                                       */
    /* ---------------------------------------------------------------------- */
    /**
     * Update the current access and refresh tokens.
     */
    SomfyCloudNewAuth.prototype.updateToken = function (token) {
        if (!token.access_token) {
            throw new SomfyAuthError('Somfy authentication response contains no access token');
        }
        this.accessToken = token.access_token;
        /*
         * Ginaite may rotate refresh tokens.
         *
         * Never overwrite a valid existing refresh token
         * with an undefined response value.
         */
        if (token.refresh_token) {
            this.refreshToken = token.refresh_token;
        }
        var expiresIn = typeof token.expires_in === 'number' &&
            Number.isFinite(token.expires_in) &&
            token.expires_in > 0
            ? token.expires_in
            : FALLBACK_TOKEN_LIFETIME_MS / 1000;
        this.expiresAt = Date.now() + expiresIn * 1000;
    };
    /* ---------------------------------------------------------------------- */
    /* Session restoration                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     * Restore a previously persisted session.
     *
     * The access token is deliberately not restored.
     * A fresh site-scoped token is obtained on demand.
     */
    SomfyCloudNewAuth.prototype.restoreSession = function (session) {
        if (this.closed) {
            throw new SomfyAuthError('Cannot restore a closed Somfy authentication instance');
        }
        if (!session ||
            typeof session.refreshToken !== 'string' ||
            !session.refreshToken ||
            typeof session.siteOid !== 'string' ||
            !session.siteOid ||
            typeof session.gatewayId !== 'string' ||
            !session.gatewayId ||
            typeof session.region !== 'string' ||
            !session.region) {
            throw new SomfyAuthError('Invalid Somfy OAuth session');
        }
        var endpoint = REGION_ENDPOINTS[session.region];
        if (!endpoint) {
            throw new SomfyAuthError("Unknown Somfy region: ".concat(session.region));
        }
        this.refreshToken = session.refreshToken;
        this.selectedSiteOid = session.siteOid;
        this.selectedGatewayId = session.gatewayId;
        this.selectedRegion = session.region;
        this.selectedEndpoint = endpoint;
        /*
         * The restored credentials are already persisted.
         */
        this.persistedSessionKey = this.sessionKey(session);
        /*
         * Clear all access-token state.
         */
        this.accessToken = null;
        this.expiresAt = 0;
        this.tokenSiteOid = null;
        this.loggedIn = true;
    };
    /* ---------------------------------------------------------------------- */
    /* Logout                                                                 */
    /* ---------------------------------------------------------------------- */
    /**
     * Clear the local authentication session.
     *
     * This deliberately does not revoke the remote refresh token.
     *
     * The method remains synchronous for compatibility
     * with existing SomfyCloudApi logout handling.
     */
    SomfyCloudNewAuth.prototype.logout = function () {
        this.closed = true;
        this.loggedIn = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = 0;
        this.tokenSiteOid = null;
        this.gateways = [];
        this.selectedSiteOid = null;
        this.selectedGatewayId = null;
        this.selectedRegion = null;
        this.selectedEndpoint = null;
        this.persistedSessionKey = null;
        this.tokenRefreshCallback = undefined;
    };
    /* ---------------------------------------------------------------------- */
    /* HTTP error handling                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     * Convert Axios errors into safe Somfy authentication errors.
     *
     * Never include:
     * - Request headers
     * - Passwords
     * - Access tokens
     * - Refresh tokens
     * - Request bodies
     */
    SomfyCloudNewAuth.prototype.mapHttpError = function (error, fallbackMessage) {
        var _a, _b;
        if (error instanceof SomfyAuthError) {
            return error;
        }
        if (!axios_1.default.isAxiosError(error)) {
            return new SomfyAuthError(fallbackMessage);
        }
        var axiosError = error;
        var status = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status;
        var responseData = (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.data;
        var errorCode = responseData === null || responseData === void 0 ? void 0 : responseData.error;
        /*
         * Invalid credentials or revoked refresh token.
         */
        if (errorCode === 'invalid_grant' ||
            errorCode === 'invalid_credentials' ||
            status === 401) {
            return new SomfyBadCredentialsError('Somfy authentication failed. Check the credentials or refresh token.');
        }
        /*
         * Insufficient permissions.
         */
        if (status === 403) {
            return new SomfyAuthError('Somfy authentication request was forbidden', status, 'FORBIDDEN');
        }
        /*
         * Rate limiting.
         */
        if (status === 429) {
            return new SomfyAuthError('Somfy authentication service rate limit exceeded', status, 'RATE_LIMITED');
        }
        /*
         * Server-side errors.
         */
        if (status && status >= 500) {
            return new SomfyAuthError('Somfy authentication service is temporarily unavailable', status, 'SERVER_ERROR');
        }
        /*
         * Network timeout.
         */
        if (axiosError.code === 'ECONNABORTED') {
            return new SomfyAuthError('Somfy authentication request timed out', undefined, 'TIMEOUT');
        }
        /*
         * Network connection failures.
         */
        if (axiosError.code === 'ECONNREFUSED' ||
            axiosError.code === 'ENOTFOUND' ||
            axiosError.code === 'ECONNRESET') {
            return new SomfyAuthError('Unable to connect to the Somfy authentication service', undefined, axiosError.code);
        }
        /*
         * Generic HTTP failure.
         */
        return new SomfyAuthError(fallbackMessage, status, errorCode || axiosError.code);
    };
    return SomfyCloudNewAuth;
}());
exports.SomfyCloudNewAuth = SomfyCloudNewAuth;
