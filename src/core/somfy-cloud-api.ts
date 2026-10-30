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
    this.userId = userId;
    this.userPassword = userPassword;
    this.serverUrl = serverUrl.replace(/\/$/, '');

    this.axiosInstance = axios.create({
      timeout: 20000,
    });
  }

  /**
   * Authenticate against the Somfy Overkiz cloud.
   */
  public async login(): Promise<void> {
    const sessionId = await SomfyApi.getSessionId(
      this.userId,
      this.userPassword,
      this.serverUrl,
    );

    if (!sessionId) {
      throw new Error('Somfy Cloud authentication failed');
    }

    this.sessionId = sessionId;
  }

  /**
   * Check whether the current session is still valid.
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

    if (!Array.isArray(response.data)) {
      throw new Error('Invalid action groups response from Somfy Cloud');
    }

    return response.data as ISomfyActionGroup[];
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

    if (!response.data || !response.data.execId) {
      throw new Error('Invalid scenario execution response');
    }

    return response.data as ISomfyExecutionResponse;
  }

  /**
   * Clear the local cloud session.
   * This does not revoke the session on the Somfy server.
   */
  public logout(): void {
    this.sessionId = null;
  }

  /**
   * Perform an authenticated cloud request.
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
