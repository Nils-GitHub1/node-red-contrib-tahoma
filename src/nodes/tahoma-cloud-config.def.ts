import * as nodered from 'node-red';

/**
 * Authentication methods supported by TaHoma Cloud.
 *
 * legacy:
 *   Existing Somfy username/password + JSESSIONID authentication.
 *
 * oauth:
 *   New Somfy Accounts + Ginaite OAuth authentication.
 */
export type TahomaCloudAuthMethod = 'legacy' | 'oauth';

/**
 * TaHoma Cloud configuration node properties.
 */
export interface TahomaCloudConfigNodeDef extends nodered.NodeDef {
  name: string;

  /**
   * Authentication method.
   *
   * Defaults to legacy for existing Node-RED configurations.
   */
  authMethod?: TahomaCloudAuthMethod;

  /**
   * Legacy regional server.
   *
   * Retained for backward compatibility.
   */
  region?: string;
}

/**
 * Credentials stored by the Node-RED configuration node.
 *
 * Node-RED encrypts these credential properties.
 */
export interface TahomaCloudCredentials {
  /**
   * Legacy authentication credentials.
   */
  userId?: string;

  userPassword?: string;

  /**
   * New OAuth authentication credentials.
   */
  oauthUserId?: string;

  oauthUserPassword?: string;

  /**
   * Rotating Ginaite refresh token.
   */
  refreshToken?: string;

  /**
   * Selected Somfy installation.
   */
  siteOid?: string;

  /**
   * Selected Somfy gateway.
   */
  gatewayId?: string;

  /**
   * Selected regional API identifier.
   *
   * Expected values:
   * EMEA, APAC or SNABA.
   */
  oauthRegion?: string;
}

/**
 * Complete OAuth session state.
 *
 * All four properties must be persisted together whenever
 * the selected installation or refresh token changes.
 */
export interface TahomaCloudOAuthSession {
  refreshToken: string;

  siteOid: string;

  gatewayId: string;

  region: string;
}

/**
 * Public scenario representation.
 */
export interface TahomaCloudScenario {
  id: string;

  name: string;
}
