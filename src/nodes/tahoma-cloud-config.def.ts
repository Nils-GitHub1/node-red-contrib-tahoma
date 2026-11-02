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

/**
 * Authentication methods supported by TaHoma Cloud.
 */
export type TahomaCloudAuthMethod = 'legacy' | 'oauth';

/**
 * TaHoma Cloud configuration node properties.
 */
export interface TahomaCloudConfigNodeDef extends nodered.NodeDef {
  name: string;

  /**
   * Authentication method.
   * Defaults to legacy for backward compatibility.
   */
  authMethod?: TahomaCloudAuthMethod;

  /**
   * Legacy regional server.
   */
  region?: string;

  /**
   * Selected OAuth installation gateway.
   */
  gatewayId?: string;
}

/**
 * Credentials stored by the Node-RED configuration node.
 */
export interface TahomaCloudCredentials {
  /**
   * Somfy account credentials.
   */
  userId?: string;
  userPassword?: string;

  /**
   * OAuth session credentials.
   */
  refreshToken?: string;
  siteOid?: string;
  gatewayId?: string;
  oauthRegion?: string;
}

/**
 * Complete OAuth session state.
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
