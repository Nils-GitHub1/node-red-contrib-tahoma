"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SomfyApi = void 0;
const axios_1 = require("axios");
const https = require("https");
/**
 * Default timeout for Somfy API requests.
 */
const API_TIMEOUT = 20000;
class SomfyApi {
    configNode;
    axiosInstance;
    /**
     * Authenticate against the Somfy / Overkiz API.
     *
     * Returns the JSESSIONID extracted from the response cookies.
     */
    static async getSessionId(userId, userPwd, somfyOverkizSrvUrl) {
        if (!userId || !userPwd || !somfyOverkizSrvUrl) {
            throw new Error('Somfy login: missing credentials or server URL');
        }
        const loginData = new URLSearchParams({
            userId,
            userPassword: userPwd,
        });
        try {
            const response = await (0, axios_1.default)({
                url: `${somfyOverkizSrvUrl.replace(/\/+$/, '')}/login`,
                method: 'POST',
                data: loginData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json, text/plain, */*',
                },
                timeout: API_TIMEOUT,
            });
            const cookieHeader = response.headers['set-cookie'];
            // Axios normally returns Set-Cookie as an array.
            // Handle a string as well for compatibility.
            const cookies = Array.isArray(cookieHeader)
                ? cookieHeader
                : typeof cookieHeader === 'string'
                    ? [cookieHeader]
                    : [];
            // Find JSESSIONID regardless of cookie-name casing.
            const sessionCookie = cookies.find((cookie) => /^\s*JSESSIONID=/i.test(cookie));
            if (!sessionCookie) {
                throw new Error(`Somfy login returned HTTP ${response.status}, ` +
                    'but no JSESSIONID cookie was found. ' +
                    `Content-Type: ${response.headers['content-type'] || 'unknown'}. ` +
                    `Cookies received: ${cookies.map((cookie) => cookie.split('=')[0].trim()).join(', ') ||
                        'none'}.`);
            }
            // Extract the cookie value without including its attributes.
            const cookieValue = sessionCookie.trim().split(';')[0];
            const separatorIndex = cookieValue.indexOf('=');
            const sessionId = separatorIndex >= 0
                ? cookieValue.substring(separatorIndex + 1).trim()
                : '';
            if (!sessionId) {
                throw new Error('Somfy returned an empty JSESSIONID cookie');
            }
            return sessionId;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const status = error.response?.status;
                const responseData = error.response?.data;
                const serverError = typeof responseData === 'string'
                    ? responseData
                    : JSON.stringify(responseData || {});
                throw new Error(`Somfy login failed. ` +
                    `HTTP: ${status || 'No response'}. ` +
                    `Code: ${error.code || 'N/A'}. ` +
                    `Server response: ${serverError || 'No response body'}`, { cause: error });
            }
            throw error;
        }
    }
    /**
     * Generate and activate a local access token.
     *
     * HTTPS certificate verification remains enabled.
     */
    static async getLocalToken(userId, userPwd, tahomaPin, somfyOverkizSrvUrl) {
        const sessionId = await SomfyApi.getSessionId(userId, userPwd, somfyOverkizSrvUrl);
        if (!sessionId) {
            return null;
        }
        const serverUrl = somfyOverkizSrvUrl.replace(/\/+$/, '');
        const sanitizedPin = encodeURIComponent(tahomaPin);
        const response = await (0, axios_1.default)({
            url: `${serverUrl}/config/${sanitizedPin}/local/tokens/generate`,
            method: 'GET',
            headers: {
                Cookie: `JSESSIONID=${sessionId}`,
                Accept: 'application/json',
            },
            timeout: API_TIMEOUT,
        });
        const token = response.data?.token;
        if (!token) {
            return null;
        }
        await SomfyApi.activateLocalToken(token, tahomaPin, sessionId, somfyOverkizSrvUrl);
        return token;
    }
    /**
     * Activate a generated local access token.
     *
     * HTTPS certificate verification remains enabled.
     */
    static async activateLocalToken(token, pin, sessionId, somfyOverkizSrvUrl) {
        const now = new Date();
        const serverUrl = somfyOverkizSrvUrl.replace(/\/+$/, '');
        const sanitizedPin = encodeURIComponent(pin);
        const label = 'Node RED Instance ' +
            now.getFullYear() +
            `${now.getMonth() + 1 < 10 ? '0' : ''}${now.getMonth() + 1}` +
            `${now.getDate() < 10 ? '0' : ''}${now.getDate()}` +
            '-' +
            now.getHours() +
            'h' +
            now.getMinutes() +
            'm' +
            now.getSeconds();
        return (0, axios_1.default)({
            url: `${serverUrl}/config/${sanitizedPin}/local/tokens`,
            method: 'POST',
            data: {
                token,
                scope: 'devmode',
                label,
            },
            headers: {
                'Content-Type': 'application/json',
                Cookie: `JSESSIONID=${sessionId}`,
            },
            timeout: API_TIMEOUT,
        });
    }
    /**
     * Initialize the Somfy API client.
     *
     * @param configNode Node-RED configuration node.
     * @param acceptUntrustedCertificates Whether to disable HTTPS
     * certificate verification for the local TaHoma connection.
     *
     * Certificate verification is enabled by default.
     */
    constructor(configNode, acceptUntrustedCertificates = configNode?.['acceptUntrustedCertificates'] === true) {
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
        this.axiosInstance.interceptors.request.use((config) => {
            const accessToken = this.getAccessToken();
            config.headers.set('Authorization', `Bearer ${accessToken}`);
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }
    /**
     * Execute an authenticated API request.
     *
     * Axios automatically rejects HTTP responses outside the 2xx range.
     * The original error is preserved for better diagnostics.
     */
    async _request(options) {
        const response = await this.axiosInstance({
            timeout: API_TIMEOUT,
            ...options,
        });
        return response.data;
    }
    /**
     * Retrieve the configured access token.
     */
    getAccessToken() {
        const token = this.configNode?.['token'];
        if (typeof token !== 'string' || !token.trim()) {
            throw new Error('Somfy API: missing access token in configuration node');
        }
        return token;
    }
    /**
     * Retrieve the configured gateway URL.
     */
    getGatewayUrl() {
        const configuredUrl = this.configNode?.['url'];
        if (typeof configuredUrl !== 'string' || !configuredUrl.trim()) {
            throw new Error('Somfy API: missing gateway URL in configuration node');
        }
        const baseUrl = configuredUrl.replace(/\/+$/, '');
        return `${baseUrl}/enduser-mobile-web/1/enduserAPI`;
    }
    /**
     * Retrieve a device.
     */
    getDevice(device) {
        const sanitizedDeviceUrl = encodeURIComponent(device);
        return this._request({
            url: `${this.getGatewayUrl()}/setup/devices/${sanitizedDeviceUrl}`,
            method: 'GET',
        });
    }
    /**
     * Retrieve device states.
     */
    getDeviceStates(device) {
        const sanitizedDeviceUrl = encodeURIComponent(device);
        return this._request({
            url: `${this.getGatewayUrl()}/setup/devices/${sanitizedDeviceUrl}/states`,
            method: 'GET',
        });
    }
    /**
     * Retrieve all configured devices.
     */
    getDevices() {
        return this._request({
            url: `${this.getGatewayUrl()}/setup/devices`,
            method: 'GET',
        });
    }
    /**
     * Execute a device command.
     */
    execute(device, command) {
        return this._request({
            url: `${this.getGatewayUrl()}/exec/apply`,
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
    }
    /**
     * Retrieve the status of a command execution.
     */
    getStatusForExecutionId(execId) {
        const sanitizedExecId = encodeURIComponent(execId);
        return this._request({
            url: `${this.getGatewayUrl()}/exec/current/${sanitizedExecId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
exports.SomfyApi = SomfyApi;
