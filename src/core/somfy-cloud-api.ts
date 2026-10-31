import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { SomfyApi } from './somfy-api';

export interface ISomfyActionGroup {
  oid: string;
  label: string;
}

export interface ISomfyExecutionResponse {
  execId: string;
}

export class SomfyCloudApi {
  private readonly serverUrl: string;
  private readonly userId: string;
  private readonly userPassword: string;
  private readonly axiosInstance: AxiosInstance;

  private sessionId: string | null = null;

  constructor(userId: string, userPassword: string, serverUrl: string) {
    if (!userId || !userPassword || !serverUrl) {
      throw new Error('Somfy Cloud: missing credentials or server URL');
    }

    this.userId = userId;
    this.userPassword = userPassword;
    this.serverUrl = serverUrl.replace(/\/+$/, '');

    this.axiosInstance = axios.create({
      timeout: 20000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  /**
   * Authenticate against the Somfy Overkiz cloud.
   *
   * Uses SomfyApi.getSessionId() to authenticate and retrieve
   * the JSESSIONID cookie.
   */
  public async login(): Promise<void> {
    // Clear any previous session.
    this.sessionId = null;

    try {
      const sessionId = await SomfyApi.getSessionId(
        this.userId,
        this.userPassword,
        this.serverUrl,
      );

      if (!sessionId) {
        throw new Error(
          'Somfy Cloud did not return a valid JSESSIONID cookie. ' +
            'Check credentials, region and account permissions.',
        );
      }

      this.sessionId = sessionId;
    } catch (error) {
      this.sessionId = null;

      // Preserve the original error, including Axios HTTP details.
      throw error;
    }
  }

  /**
   * Check whether the current session is still valid.
   *
   * This method checks both authentication and access to
   * the actionGroups endpoint.
   */
  public async isAuthenticated(): Promise<boolean> {
    if (!this.sessionId) {
      return false;
    }

    try {
      await this.getActionGroups();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieve scenarios already created in the TaHoma application.
   */
  public async getActionGroups(): Promise<ISomfyActionGroup[]> {
    const response = await this.request({
      url: `${this.serverUrl}/actionGroups`,
      method: 'GET',
    });

    const actionGroups = response.data;

    if (!Array.isArray(actionGroups)) {
      throw new Error(
        'Invalid action groups response from Somfy Cloud: ' +
          'expected an array',
      );
    }

    // Validate the essential properties of each scenario.
    for (const group of actionGroups) {
      if (
        !group ||
        typeof group.oid !== 'string' ||
        typeof group.label !== 'string'
      ) {
        throw new Error(
          'Invalid action group received from Somfy Cloud: ' +
            'missing oid or label',
        );
      }
    }

    return actionGroups as ISomfyActionGroup[];
  }

  /**
   * Execute an existing TaHoma scenario.
   */
  public async executeActionGroup(
    actionGroupId: string,
  ): Promise<ISomfyExecutionResponse> {
    if (!actionGroupId) {
      throw new Error('Action group ID is required');
    }

    const response = await this.request({
      url: `${this.serverUrl}/exec/${encodeURIComponent(actionGroupId)}`,
      method: 'POST',
    });

    if (
      !response.data ||
      typeof response.data.execId !== 'string' ||
      !response.data.execId
    ) {
      throw new Error('Invalid scenario execution response from Somfy Cloud');
    }

    return response.data as ISomfyExecutionResponse;
  }

  /**
   * Clear the local cloud session.
   *
   * This does not revoke the session on the Somfy server.
   */
  public logout(): void {
    this.sessionId = null;
  }

  /**
   * Perform an authenticated cloud request.
   *
   * Axios errors are deliberately preserved so that callers
   * can inspect HTTP status, response data and error codes.
   */
  private request(options: AxiosRequestConfig): Promise<AxiosResponse> {
    if (!this.sessionId) {
      return Promise.reject(new Error('Not authenticated with Somfy Cloud'));
    }

    const config: AxiosRequestConfig = {
      ...options,
      headers: {
        ...options.headers,
        Cookie: `JSESSIONID=${this.sessionId}`,
      },
    };

    return this.axiosInstance.request(config);
  }
}
