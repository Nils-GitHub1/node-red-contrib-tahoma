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
/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */
var SOMFY_API = 'https://accounts.somfy.com';
var SOMFY_CLIENT_ID = '0d8e920c-1478-11e7-a377-02dd59bd3041_1ewvaqmclfogo4kcsoo0c8k4kso884owg08sg8c40sk4go4ksg';
var SOMFY_CLIENT_SECRET = '12k73w1n540g8o4cokg0cw84cog840k84cwggscwg884004kgk';
var SOMFY_GINAITE_TOKEN_URL = 'https://ginaite-prod.ovkube.net/realms/somfy-tahoma/protocol/openid-connect/token';
var SOMFY_GINAITE_SUBJECT_ISSUER = 'somfy-customer';
var SOMFY_GINAITE_TOKEN_EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange';
var SOMFY_GINAITE_SUBJECT_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:access_token';
var SOMFY_BOB_SITE_API = 'https://backoffice-service.ovkube.net/site-api/public/v1';
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
var COUNTRY_REGIONS = {
    // North America
    CA: 'SNABA',
    US: 'SNABA',
    MX: 'SNABA',
    // Asia Pacific
    AU: 'APAC',
    HK: 'APAC',
    IN: 'APAC',
    ID: 'APAC',
    JP: 'APAC',
    MY: 'APAC',
    NZ: 'APAC',
    PH: 'APAC',
    SG: 'APAC',
    TW: 'APAC',
    TH: 'APAC',
    VN: 'APAC',
    KR: 'APAC',
    CN: 'APAC',
    // Europe, Middle East and Africa
    AL: 'EMEA',
    AD: 'EMEA',
    AT: 'EMEA',
    BY: 'EMEA',
    BE: 'EMEA',
    BG: 'EMEA',
    HR: 'EMEA',
    CY: 'EMEA',
    CZ: 'EMEA',
    DK: 'EMEA',
    EG: 'EMEA',
    EE: 'EMEA',
    FO: 'EMEA',
    FI: 'EMEA',
    FR: 'EMEA',
    GF: 'EMEA',
    PF: 'EMEA',
    DE: 'EMEA',
    GR: 'EMEA',
    GP: 'EMEA',
    HU: 'EMEA',
    IL: 'EMEA',
    IT: 'EMEA',
    JE: 'EMEA',
    JO: 'EMEA',
    KZ: 'EMEA',
    KW: 'EMEA',
    LV: 'EMEA',
    LB: 'EMEA',
    LT: 'EMEA',
    LU: 'EMEA',
    MQ: 'EMEA',
    YT: 'EMEA',
    MC: 'EMEA',
    MA: 'EMEA',
    NL: 'EMEA',
    NO: 'EMEA',
    NC: 'EMEA',
    PS: 'EMEA',
    PL: 'EMEA',
    PT: 'EMEA',
    QA: 'EMEA',
    IE: 'EMEA',
    RE: 'EMEA',
    RO: 'EMEA',
    RU: 'EMEA',
    BL: 'EMEA',
    SA: 'EMEA',
    RS: 'EMEA',
    SK: 'EMEA',
    ZA: 'EMEA',
    ES: 'EMEA',
    SE: 'EMEA',
    CH: 'EMEA',
    TN: 'EMEA',
    TR: 'EMEA',
    UA: 'EMEA',
    AE: 'EMEA',
    GB: 'EMEA',
    // Additional EMEA countries
    AM: 'EMEA',
    AO: 'EMEA',
    AZ: 'EMEA',
    BA: 'EMEA',
    BH: 'EMEA',
    CI: 'EMEA',
    CM: 'EMEA',
    DZ: 'EMEA',
    ET: 'EMEA',
    GE: 'EMEA',
    GG: 'EMEA',
    GH: 'EMEA',
    GI: 'EMEA',
    IM: 'EMEA',
    IQ: 'EMEA',
    IS: 'EMEA',
    KE: 'EMEA',
    KG: 'EMEA',
    LI: 'EMEA',
    LY: 'EMEA',
    MD: 'EMEA',
    ME: 'EMEA',
    MG: 'EMEA',
    MK: 'EMEA',
    MT: 'EMEA',
    MU: 'EMEA',
    NA: 'EMEA',
    NG: 'EMEA',
    OM: 'EMEA',
    SI: 'EMEA',
    SM: 'EMEA',
    SN: 'EMEA',
    TZ: 'EMEA',
    UG: 'EMEA',
    UZ: 'EMEA',
    VA: 'EMEA',
    ZM: 'EMEA',
    ZW: 'EMEA',
};
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
    /**
     * Create a new Somfy OAuth authentication instance.
     *
     * Fresh login:
     *   username + password
     *
     * Restored session:
     *   refreshToken + siteOid + gatewayId + region
     */
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
        this.persistedRefreshToken = null;
        this.warnedMissingCallback = false;
        this.loggedIn = false;
        this.closed = false;
        this.username = options.username;
        this.password = options.password;
        this.refreshToken = options.refreshToken || null;
        this.persistedRefreshToken = options.refreshToken || null;
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
     * Authenticate using either a fresh login or a stored session.
     *
     * Concurrent login requests share the same Promise.
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
                                 * Restore an existing OAuth session.
                                 *
                                 * The stored refresh token will be exchanged
                                 * for a fresh site-scoped token when needed.
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
                                 * Exchange the Somfy Accounts token
                                 * for a Ginaite account-wide token.
                                 */
                                return [4 /*yield*/, this.performGinaiteTokenExchange(this.accessToken)];
                            case 2:
                                /*
                                 * Exchange the Somfy Accounts token
                                 * for a Ginaite account-wide token.
                                 */
                                _a.sent();
                                if (!this.accessToken) {
                                    throw new SomfyAuthError('Ginaite token exchange did not return an access token');
                                }
                                this.loggedIn = true;
                                /*
                                 * Discover all installations associated
                                 * with the Somfy account.
                                 */
                                return [4 /*yield*/, this.discoverGateways()];
                            case 3:
                                /*
                                 * Discover all installations associated
                                 * with the Somfy account.
                                 */
                                _a.sent();
                                /*
                                 * Automatically select the only available
                                 * installation.
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
    /**
     * Somfy Accounts password grant.
     *
     * This is the first authentication step.
     */
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
    /* Ginaite / Keycloak token exchange                                      */
    /* ---------------------------------------------------------------------- */
    /**
     * Exchange the Somfy Accounts access token for a Ginaite token.
     */
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
     * Discover all Somfy sites and installations.
     *
     * BOB uses an account-wide Ginaite token.
     * The listing is paginated.
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
                        results = page.results || [];
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
                            /*
                             * Each sub-site represents an OverKiz setup.
                             */
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
                                    externalId: subSite.externalId,
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
                        return [2 /*return*/, this.gateways];
                }
            });
        });
    };
    /* ---------------------------------------------------------------------- */
    /* BOB API requests                                                        */
    /* ---------------------------------------------------------------------- */
    /**
     * Make an authenticated BOB API request.
     */
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
    /**
     * Ensure that an account-wide token is available.
     *
     * BOB discovery requires an account-wide token.
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
                         * The next regional API request must restore
                         * the selected site's token scope.
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
     * Select a gateway and its corresponding Somfy installation.
     *
     * Determines:
     * - Site OID
     * - Gateway ID
     * - Regional API endpoint
     */
    SomfyCloudNewAuth.prototype.selectGateway = function (gatewayId) {
        var gateway = this.gateways.find(function (candidate) { return candidate.gatewayId === gatewayId; });
        if (!gateway) {
            throw new SomfyAuthError("Unknown Somfy gateway ID: ".concat(gatewayId));
        }
        var endpoint = REGION_ENDPOINTS[gateway.region];
        if (!endpoint) {
            throw new SomfyAuthError("No API endpoint configured for region ".concat(gateway.region));
        }
        this.selectedGatewayId = gateway.gatewayId;
        this.selectedSiteOid = gateway.homeId;
        this.selectedRegion = gateway.region;
        this.selectedEndpoint = endpoint;
        /*
         * Force generation of a site-scoped token
         * on the next regional API request.
         */
        this.expiresAt = 0;
    };
    /**
     * Resolve the regional API endpoint from a country code.
     */
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
    /* Token refresh                                                          */
    /* ---------------------------------------------------------------------- */
    /**
     * Check whether the access token has expired.
     *
     * A safety margin avoids using a token immediately
     * before its actual expiration.
     */
    SomfyCloudNewAuth.prototype.isExpired = function () {
        if (!this.accessToken || !this.expiresAt) {
            return true;
        }
        return Date.now() + TOKEN_EXPIRY_MARGIN_MS >= this.expiresAt;
    };
    /**
     * Refresh the token if necessary.
     *
     * Concurrent callers share one refresh Promise.
     */
    SomfyCloudNewAuth.prototype.refreshIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isExpired()) {
                            return [2 /*return*/, false];
                        }
                        if (!this.refreshToken) {
                            if (this.selectedSiteOid) {
                                throw new SomfyAuthError('Cannot generate a site-scoped token without a refresh token');
                            }
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.refreshTokenWithLock(this.selectedSiteOid)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Serialize refresh requests.
     *
     * This is important because Ginaite may rotate refresh tokens.
     */
    SomfyCloudNewAuth.prototype.refreshTokenWithLock = function (siteOid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.refreshPromise) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.refreshPromise];
                    case 1:
                        _a.sent();
                        /*
                         * Another request may already have generated
                         * a token with the requested scope.
                         */
                        if (!this.isExpired() && this.tokenSiteOid === siteOid) {
                            return [2 /*return*/];
                        }
                        _a.label = 2;
                    case 2:
                        this.refreshPromise = this.performRefresh(siteOid);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, , 5, 6]);
                        return [4 /*yield*/, this.refreshPromise];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        this.refreshPromise = null;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Perform the Ginaite refresh grant.
     *
     * When siteOid is provided, the returned token is
     * scoped to the selected Somfy installation.
     *
     * Otherwise, an account-wide token is requested.
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
                        this.updateToken(token);
                        if (typeof token.expires_in !== 'number' || token.expires_in <= 0) {
                            this.expiresAt = Date.now() + FALLBACK_TOKEN_LIFETIME_MS;
                        }
                        this.tokenSiteOid = siteOid;
                        /*
                         * Keep the existing refresh token if the server
                         * does not return a replacement.
                         */
                        if (!this.refreshToken) {
                            this.refreshToken = previousRefreshToken;
                        }
                        return [4 /*yield*/, this.notifyTokenRefresh()];
                    case 5:
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
     * Notify Node-RED when the OAuth session changes.
     *
     * The complete session is persisted together:
     * - refreshToken
     * - siteOid
     * - gatewayId
     * - region
     *
     * This ensures that a restored session can identify
     * the correct Somfy installation.
     */
    SomfyCloudNewAuth.prototype.notifyTokenRefresh = function () {
        return __awaiter(this, void 0, void 0, function () {
            var session, changed, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.refreshToken) {
                            return [2 /*return*/];
                        }
                        session = this.getSession();
                        changed = session.refreshToken !== this.persistedRefreshToken;
                        if (!changed) {
                            return [2 /*return*/];
                        }
                        if (!this.tokenRefreshCallback) {
                            if (!this.warnedMissingCallback) {
                                this.warnedMissingCallback = true;
                                console.warn('[Somfy OAuth] Session changed but no persistence callback is configured. ' +
                                    'The updated refresh token may not survive a restart.');
                            }
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tokenRefreshCallback(session)];
                    case 2:
                        _a.sent();
                        this.persistedRefreshToken = session.refreshToken;
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        console.error('[Somfy OAuth] Unable to persist the updated session:', error_6 instanceof Error ? error_6.message : 'Unknown persistence error');
                        return [3 /*break*/, 4];
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
     * Return the complete session.
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
     * Export credentials for Node-RED persistence.
     *
     * The access token is deliberately not persisted.
     */
    SomfyCloudNewAuth.prototype.toCredentials = function () {
        var session = this.getSession();
        this.persistedRefreshToken = session.refreshToken;
        return session;
    };
    /* ---------------------------------------------------------------------- */
    /* Authentication headers                                                */
    /* ---------------------------------------------------------------------- */
    /**
     * Return the authentication headers for the OverKiz API.
     */
    SomfyCloudNewAuth.prototype.getAuthHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.loggedIn) {
                            throw new SomfyAuthError('Somfy account is not authenticated');
                        }
                        if (!this.selectedSiteOid) {
                            throw new SomfyNoGatewaySelectedError('No Somfy installation selected. ' +
                                'Call discoverGateways() and selectGateway() first.');
                        }
                        return [4 /*yield*/, this.refreshIfNeeded()];
                    case 1:
                        _a.sent();
                        if (!this.accessToken) {
                            throw new SomfyAuthError('No valid Somfy access token available');
                        }
                        if (this.tokenSiteOid !== this.selectedSiteOid) {
                            throw new SomfyAuthError('Somfy access token is not scoped to the selected installation');
                        }
                        return [2 /*return*/, {
                                Authorization: "Bearer ".concat(this.accessToken),
                            }];
                }
            });
        });
    };
    Object.defineProperty(SomfyCloudNewAuth.prototype, "endpoint", {
        /* ---------------------------------------------------------------------- */
        /* Public properties                                                      */
        /* ---------------------------------------------------------------------- */
        /**
         * Return the selected OverKiz API endpoint.
         */
        get: function () {
            if (!this.selectedEndpoint) {
                throw new SomfyNoGatewaySelectedError('No Somfy installation selected');
            }
            return this.selectedEndpoint;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "selectedSite", {
        /**
         * Return the selected site OID.
         */
        get: function () {
            return this.selectedSiteOid;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "selectedGateway", {
        /**
         * Return the selected gateway ID.
         */
        get: function () {
            return this.selectedGatewayId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SomfyCloudNewAuth.prototype, "availableGateways", {
        /**
         * Return the discovered installations.
         */
        get: function () {
            return __spreadArray([], this.gateways, true);
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
    /**
     * Check whether authentication has been initialized.
     */
    SomfyCloudNewAuth.prototype.isAuthenticated = function () {
        return this.loggedIn && !!this.refreshToken;
    };
    /* ---------------------------------------------------------------------- */
    /* Logout                                                                 */
    /* ---------------------------------------------------------------------- */
    /**
     * Clear the in-memory authentication context.
     *
     * This does not revoke tokens on Somfy servers.
     */
    SomfyCloudNewAuth.prototype.logout = function () {
        this.closed = true;
        this.loggedIn = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.expiresAt = 0;
        this.tokenSiteOid = null;
        this.selectedSiteOid = null;
        this.selectedGatewayId = null;
        this.selectedRegion = null;
        this.selectedEndpoint = null;
        this.gateways = [];
        this.tokenRefreshCallback = undefined;
        this.refreshPromise = null;
        this.loginPromise = null;
    };
    /* ---------------------------------------------------------------------- */
    /* Token management                                                       */
    /* ---------------------------------------------------------------------- */
    /**
     * Update the local token context from an OAuth response.
     */
    SomfyCloudNewAuth.prototype.updateToken = function (token) {
        if (token.access_token) {
            this.accessToken = token.access_token;
        }
        if (token.refresh_token) {
            this.refreshToken = token.refresh_token;
        }
        if (typeof token.expires_in === 'number' && token.expires_in > 0) {
            this.expiresAt = Date.now() + token.expires_in * 1000;
        }
    };
    /* ---------------------------------------------------------------------- */
    /* HTTP error handling                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     * Convert Axios errors into useful authentication errors.
     */
    SomfyCloudNewAuth.prototype.mapHttpError = function (error, fallbackMessage) {
        var _a, _b;
        var axiosError = error;
        if (!axiosError.isAxiosError) {
            return new SomfyAuthError(error instanceof Error ? error.message : fallbackMessage);
        }
        var status = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status;
        var responseData = (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.data;
        var code = responseData === null || responseData === void 0 ? void 0 : responseData.error;
        var message = (responseData === null || responseData === void 0 ? void 0 : responseData.error_description) ||
            (responseData === null || responseData === void 0 ? void 0 : responseData.message) ||
            axiosError.message ||
            fallbackMessage;
        if (code === 'invalid_grant' || code === 'error.invalid.grant') {
            return new SomfyBadCredentialsError(message);
        }
        return new SomfyAuthError("".concat(fallbackMessage, ": ").concat(message), status, code);
    };
    return SomfyCloudNewAuth;
}());
exports.SomfyCloudNewAuth = SomfyCloudNewAuth;
