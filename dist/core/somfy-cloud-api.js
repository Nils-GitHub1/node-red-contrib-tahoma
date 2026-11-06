"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SomfyCloudApi = void 0;
const axios_1 = require("axios");
const somfy_api_1 = require("./somfy-api");
class SomfyCloudApi {
    authMethod;
    serverUrl;
    userId;
    userPassword;
    oauthAuth;
    axiosInstance;
    sessionId = null;
    constructor(userIdOrAuth, userPassword, serverUrl) {
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
    async login() {
        if (this.authMethod === 'legacy') {
            await this.loginLegacy();
            return;
        }
        if (!this.oauthAuth) {
            throw new Error('Somfy Cloud: OAuth authentication is unavailable');
        }
        await this.oauthAuth.login();
    }
    /**
     * Legacy JSESSIONID authentication.
     */
    async loginLegacy() {
        if (!this.userId || !this.userPassword) {
            throw new Error('Somfy Cloud: legacy credentials are missing');
        }
        this.sessionId = null;
        try {
            const sessionId = await somfy_api_1.SomfyApi.getSessionId(this.userId, this.userPassword, this.serverUrl);
            if (!sessionId) {
                throw new Error('Somfy Cloud did not return a valid JSESSIONID cookie. ' +
                    'Check credentials, region and account permissions.');
            }
            this.sessionId = sessionId;
        }
        catch (error) {
            this.sessionId = null;
            // Preserve the original Axios or authentication error.
            throw error;
        }
    }
    /**
     * Check whether a local authentication context is available.
     *
     * This is a local check only and does not make an HTTP request.
     */
    hasSession() {
        if (this.authMethod === 'legacy') {
            return this.sessionId !== null;
        }
        return this.oauthAuth?.isAuthenticated() === true;
    }
    /**
     * Check whether the current session is valid.
     *
     * This performs an actual request to actionGroups.
     */
    async isAuthenticated() {
        if (!this.hasSession()) {
            return false;
        }
        try {
            await this.getActionGroups();
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Retrieve scenarios already created in the TaHoma application.
     */
    async getActionGroups() {
        const response = await this.request({
            url: `${this.getEndpoint()}actionGroups`,
            method: 'GET',
        });
        const actionGroups = response.data;
        if (!Array.isArray(actionGroups)) {
            throw new Error('Invalid action groups response from Somfy Cloud: ' +
                'expected an array');
        }
        for (const group of actionGroups) {
            if (!group ||
                typeof group.oid !== 'string' ||
                typeof group.label !== 'string') {
                throw new Error('Invalid action group received from Somfy Cloud: ' +
                    'missing oid or label');
            }
        }
        return actionGroups;
    }
    /**
     * Execute an existing TaHoma scenario.
     *
     * Execution is deliberately not retried automatically.
     */
    async executeActionGroup(actionGroupId) {
        if (!actionGroupId) {
            throw new Error('Action group ID is required');
        }
        const response = await this.request({
            url: `${this.getEndpoint()}exec/` + encodeURIComponent(actionGroupId),
            method: 'POST',
        });
        if (!response.data ||
            typeof response.data.execId !== 'string' ||
            !response.data.execId) {
            throw new Error('Invalid scenario execution response from Somfy Cloud');
        }
        return response.data;
    }
    /**
     * Register a Somfy Cloud event listener.
     */
    async registerEventListener() {
        const response = await this.request({
            url: `${this.getEndpoint()}events/register`,
            method: 'POST',
        });
        if (!response.data || typeof response.data.id !== 'string') {
            throw new Error('Invalid event listener response from Somfy Cloud');
        }
        return response.data.id;
    }
    /**
     * Fetch events from a registered listener.
     */
    async fetchEvents(listenerId) {
        if (!listenerId) {
            throw new Error('Event listener ID is required');
        }
        const response = await this.request({
            url: `${this.getEndpoint()}events/${encodeURIComponent(listenerId)}/fetch`,
            method: 'POST',
        });
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid events response from Somfy Cloud');
        }
        return response.data;
    }
    /**
     * Unregister a Somfy Cloud event listener.
     */
    async unregisterEventListener(listenerId) {
        if (!listenerId) {
            return;
        }
        await this.request({
            url: `${this.getEndpoint()}events/${encodeURIComponent(listenerId)}/unregister`,
            method: 'POST',
        });
    }
    /**
     * Resolve the active cloud API endpoint.
     *
     * Legacy:
     * Uses the regional URL supplied to the constructor.
     *
     * OAuth:
     * Uses the endpoint selected by SomfyCloudNewAuth.
     */
    getEndpoint() {
        if (this.authMethod === 'legacy') {
            return `${this.serverUrl.replace(/\/+$/, '')}/`;
        }
        if (!this.oauthAuth) {
            throw new Error('Somfy Cloud: OAuth authentication is unavailable');
        }
        return this.oauthAuth.endpoint;
    }
    /**
     * Generate the authentication headers.
     *
     * Legacy:
     * Cookie: JSESSIONID=...
     *
     * OAuth:
     * Authorization: Bearer ...
     */
    async getAuthenticationHeaders() {
        if (this.authMethod === 'legacy') {
            if (!this.sessionId) {
                throw new Error('Not authenticated with Somfy Cloud');
            }
            return {
                Cookie: `JSESSIONID=${this.sessionId}`,
            };
        }
        if (!this.oauthAuth) {
            throw new Error('Somfy Cloud: OAuth authentication is unavailable');
        }
        return this.oauthAuth.getAuthHeaders();
    }
    /**
     * Execute an authenticated cloud API request.
     *
     * The OAuth authentication strategy automatically handles
     * access-token expiration and refresh before returning headers.
     *
     * If Somfy rejects an OAuth access token with HTTP 401,
     * the rejected token is invalidated without deleting the
     * refresh token or selected installation.
     *
     * The failed request is deliberately not retried automatically.
     *
     * Axios errors are deliberately preserved so that the
     * configuration node can inspect HTTP status and error codes.
     */
    async request(options) {
        const authHeaders = await this.getAuthenticationHeaders();
        const config = {
            ...options,
            headers: {
                ...options.headers,
                ...authHeaders,
            },
        };
        try {
            return await this.axiosInstance.request(config);
        }
        catch (error) {
            if (this.authMethod === 'oauth' &&
                axios_1.default.isAxiosError(error) &&
                error.response?.status === 401) {
                this.invalidateSession();
            }
            throw error;
        }
    }
    /**
     * Invalidate the current local session.
     *
     * Legacy:
     * Clears the JSESSIONID.
     *
     * OAuth:
     * Invalidates the current access token without deleting
     * the refresh token or selected installation.
     */
    invalidateSession() {
        if (this.authMethod === 'legacy') {
            this.sessionId = null;
            return;
        }
        this.oauthAuth?.invalidateAccessToken();
    }
    /**
     * Clear the local authentication context.
     *
     * This does not revoke tokens or sessions on Somfy servers.
     */
    logout() {
        if (this.authMethod === 'legacy') {
            this.invalidateSession();
            return;
        }
        this.oauthAuth?.logout();
    }
    /**
     * Return the selected authentication method.
     */
    getAuthMethod() {
        return this.authMethod;
    }
    /**
     * Return the OAuth authentication instance.
     *
     * Returns undefined when using legacy authentication.
     */
    getOAuthAuth() {
        return this.oauthAuth;
    }
}
exports.SomfyCloudApi = SomfyCloudApi;
