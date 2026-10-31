import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';

import { ICommand } from '../interfaces/command';
import { IDevice } from '../interfaces/device';
import { ICommandExecutionResponse } from '../interfaces/command-execution-response';
import { Node } from 'node-red';

/**
 * Default timeout for Somfy API requests.
 */
const API_TIMEOUT = 20000;

export class SomfyApi {
  private configNode: Node;
  private axiosInstance: AxiosInstance;

  /**
   * Authenticate against the Somfy / Overkiz API.
   *
   * Returns the JSESSIONID extracted from the response cookies.
   */
  static async getSessionId(
    userId: string,
    userPwd: string,
    somfyOverkizSrvUrl: string,
  ): Promise<string | null> {
    if (!userId || !userPwd || !somfyOverkizSrvUrl) {
      throw new Error('Somfy login: missing credentials or server URL');
    }

    const loginData = new URLSearchParams({
      userId,
      userPassword: userPwd,
    });

    try {
      const response: AxiosResponse = await axios({
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
      const cookies: string[] = Array.isArray(cookieHeader)
        ? cookieHeader
        : typeof cookieHeader === 'string'
          ? [cookieHeader]
          : [];

      // Find JSESSIONID regardless of cookie-name casing.
      const sessionCookie = cookies.find((cookie) =>
        /^\s*JSESSIONID=/i.test(cookie),
      );

      if (!sessionCookie) {
        throw new Error(
          `Somfy login returned HTTP ${response.status}, ` +
            'but no JSESSIONID cookie was found. ' +
            `Content-Type: ${response.headers['content-type'] || 'unknown'}. ` +
            `Cookies received: ${
              cookies.map((cookie) => cookie.split('=')[0].trim()).join(', ') ||
              'none'
            }.`,
        );
      }

      // Extract the cookie value without including its attributes.
      const cookieValue = sessionCookie.trim().split(';')[0];

      const separatorIndex = cookieValue.indexOf('=');

      const sessionId =
        separatorIndex >= 0
          ? cookieValue.substring(separatorIndex + 1).trim()
          : '';

      if (!sessionId) {
        throw new Error('Somfy returned an empty JSESSIONID cookie');
      }

      return sessionId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data;

        const serverError =
          typeof responseData === 'string'
            ? responseData
            : JSON.stringify(responseData || {});

        throw new Error(
          `Somfy login failed. ` +
            `HTTP: ${status || 'No response'}. ` +
            `Code: ${error.code || 'N/A'}. ` +
            `Server response: ${serverError || 'No response body'}`,
        );
      }

      throw error;
    }
  }

  /**
   * Generate and activate a local access token.
   */
  static async getLocalToken(
    userId: string,
    userPwd: string,
    tahomaPin: string,
    somfyOverkizSrvUrl: string,
  ): Promise<string | null> {
    const sessionId = await SomfyApi.getSessionId(
      userId,
      userPwd,
      somfyOverkizSrvUrl,
    );

    if (!sessionId) {
      return null;
    }

    const serverUrl = somfyOverkizSrvUrl.replace(/\/+$/, '');
    const sanitizedPin = encodeURIComponent(tahomaPin);

    const response = await axios({
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

    await SomfyApi.activateLocalToken(
      token,
      tahomaPin,
      sessionId,
      somfyOverkizSrvUrl,
    );

    return token;
  }

  /**
   * Activate a generated local access token.
   */
  static async activateLocalToken(
    token: string,
    pin: string,
    sessionId: string,
    somfyOverkizSrvUrl: string,
  ) {
    const now = new Date();

    const serverUrl = somfyOverkizSrvUrl.replace(/\/+$/, '');
    const sanitizedPin = encodeURIComponent(pin);

    const label =
      'Node RED Instance ' +
      now.getFullYear() +
      `${now.getMonth() + 1 < 10 ? '0' : ''}${now.getMonth() + 1}` +
      `${now.getDate() < 10 ? '0' : ''}${now.getDate()}` +
      '-' +
      now.getHours() +
      'h' +
      now.getMinutes() +
      'm' +
      now.getSeconds();

    return axios({
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
   */
  constructor(configNode: Node) {
    this.configNode = configNode;

    // Use Axios defaults, including normal HTTPS certificate validation.
    this.axiosInstance = axios.create();

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const accessToken = this.getAccessToken();

        config.headers = config.headers || ({} as any);

        (config.headers as any)['Authorization'] = `Bearer ${accessToken}`;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  /**
   * Execute an authenticated API request.
   *
   * Axios automatically rejects HTTP responses outside the 2xx range.
   * The original error is preserved for better diagnostics.
   */
  private async _request(options: AxiosRequestConfig): Promise<any> {
    const response: AxiosResponse = await this.axiosInstance({
      timeout: API_TIMEOUT,
      ...options,
    });

    return response.data;
  }

  /**
   * Retrieve the configured access token.
   */
  private getAccessToken(): string {
    const token = this.configNode?.['token'];

    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Somfy API: missing access token in configuration node');
    }

    return token;
  }

  /**
   * Retrieve the configured gateway URL.
   */
  private getGatewayUrl(): string {
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
  public getDevice(device: string): Promise<IDevice> {
    const sanitizedDeviceUrl = encodeURIComponent(device);

    return this._request({
      url: `${this.getGatewayUrl()}/setup/devices/${sanitizedDeviceUrl}`,
      method: 'GET',
    });
  }

  /**
   * Retrieve device states.
   */
  public getDeviceStates(
    device: string,
  ): Promise<Array<{ name: string; value: unknown }>> {
    const sanitizedDeviceUrl = encodeURIComponent(device);

    return this._request({
      url: `${this.getGatewayUrl()}/setup/devices/${sanitizedDeviceUrl}/states`,
      method: 'GET',
    });
  }

  /**
   * Retrieve all configured devices.
   */
  public getDevices(): Promise<IDevice[]> {
    return this._request({
      url: `${this.getGatewayUrl()}/setup/devices`,
      method: 'GET',
    });
  }

  /**
   * Execute a device command.
   */
  public execute(
    device: string,
    command: ICommand,
  ): Promise<ICommandExecutionResponse> {
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
  public getStatusForExecutionId(execId: string) {
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
