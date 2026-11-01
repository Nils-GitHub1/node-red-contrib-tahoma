import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { SomfyApi } from './somfy-api';
import { SomfyCloudNewAuth } from './somfy-cloud-new-auth';

export type SomfyCloudAuthMethod = 'legacy' | 'oauth';

export interface ISomfyActionGroup {
  oid: string;
  label: string;
}

export interface ISomfyExecutionResponse {
  execId: string;
}

export class SomfyCloudApi {
  private readonly authMethod: SomfyCloudAuthMethod;

  private readonly serverUrl: string;

  private readonly userId?: string;
  private readonly userPassword?: string;

  private readonly oauthAuth?: SomfyCloudNewAuth;

  private readonly axiosInstance: AxiosInstance;

  private sessionId: string | null = null;

  /**
   * Legacy constructor.
   *
   * Kept for backward compatibility with existing Node-RED
   * configurations and integrations.
   */
  constructor(userId: string, userPassword: string, serverUrl: string);

  /**
   * New OAuth constructor.
   */
  constructor(oauthAuth: SomfyCloudNewAuth);

  constructor(
    userIdOrAuth: string | SomfyCloudNewAuth,
    userPassword?: string,
    serverUrl?: string,
  ) {
    if (typeof userIdOrAuth === 'string') {
      if (!userIdOrAuth || !userPassword || !serverUrl) {
        throw new Error(
          'Somfy Cloud: missing legacy credentials or server URL',
        );
      }

      this.authMethod = 'legacy';

      this.userId = userIdOrAuth;
      this.userPassword = userPassword;

      this.serverUrl = serverUrl.replace(/\/+$/, '');
    } else {
      if (!userIdOrAuth) {
        throw new Error(
          'Somfy Cloud: OAuth authentication instance is required',
        );
      }

      this.authMethod = 'oauth';

      this.oauthAuth = userIdOrAuth;

      // The OAuth endpoint is determined by the selected
      // Somfy installation, not by the legacy region setting.
      this.serverUrl = '';
    }

    this.axiosInstance = axios.create({
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
  public async login(): Promise<void> {
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
  private async loginLegacy(): Promise<void> {
    if (!this.userId || !this.userPassword) {
      throw new Error('Somfy Cloud: legacy credentials are missing');
    }

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

      // Preserve the original Axios or authentication error.
      throw error;
    }
  }

  /**
   * Check whether a local authentication context is available.
   *
   * This is a local check only and does not make an HTTP request.
   */
  public hasSession(): boolean {
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
  public async isAuthenticated(): Promise<boolean> {
    if (!this.hasSession()) {
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
      url: `${this.getEndpoint()}actionGroups`,
      method: 'GET',
    });

    const actionGroups = response.data;

    if (!Array.isArray(actionGroups)) {
      throw new Error(
        'Invalid action groups response from Somfy Cloud: ' +
          'expected an array',
      );
    }

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
   *
   * Execution is deliberately not retried automatically.
   */
  public async executeActionGroup(
    actionGroupId: string,
  ): Promise<ISomfyExecutionResponse> {
    if (!actionGroupId) {
      throw new Error('Action group ID is required');
    }

    const response = await this.request({
      url: `${this.getEndpoint()}exec/` + encodeURIComponent(actionGroupId),
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
   * Resolve the active cloud API endpoint.
   *
   * Legacy:
   * Uses the regional URL supplied to the constructor.
   *
   * OAuth:
   * Uses the endpoint selected by SomfyCloudNewAuth.
   */
  private getEndpoint(): string {
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
  private async getAuthenticationHeaders(): Promise<{ [key: string]: string }> {
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
   * Axios errors are deliberately preserved so that the
   * configuration node can inspect HTTP status and error codes.
   */
  private async request(options: AxiosRequestConfig): Promise<AxiosResponse> {
    const authHeaders = await this.getAuthenticationHeaders();

    const config: AxiosRequestConfig = {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders,
      },
    };

    return this.axiosInstance.request(config);
  }

  /**
   * Invalidate the current local session.
   *
   * Legacy:
   * Clears the JSESSIONID.
   *
   * OAuth:
   * Does not delete the refresh token. A subsequent request
   * can continue using the OAuth refresh mechanism.
   */
  public invalidateSession(): void {
    if (this.authMethod === 'legacy') {
      this.sessionId = null;
    }
  }

  /**
   * Clear the local authentication context.
   *
   * This does not revoke tokens or sessions on Somfy servers.
   */
  public logout(): void {
    if (this.authMethod === 'legacy') {
      this.invalidateSession();
      return;
    }

    this.oauthAuth?.logout();
  }

  /**
   * Return the selected authentication method.
   */
  public getAuthMethod(): SomfyCloudAuthMethod {
    return this.authMethod;
  }

  /**
   * Return the OAuth authentication instance.
   *
   * Returns undefined when using legacy authentication.
   */
  public getOAuthAuth(): SomfyCloudNewAuth | undefined {
    return this.oauthAuth;
  }
}
