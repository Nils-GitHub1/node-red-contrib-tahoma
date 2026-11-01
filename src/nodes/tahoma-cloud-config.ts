import * as nodered from 'node-red';
import { SomfyCloudApi } from '../core/somfy-cloud-api';
import {
  SomfyCloudNewAuth,
  ISomfyTokenState,
  ISomfyGatewayCandidate,
} from '../core/somfy-cloud-new-auth';
import { HttpResponse } from '../enums/http-response.enum';
import {
  TahomaCloudConfigNodeDef,
  TahomaCloudCredentials,
} from './tahoma-cloud-config.def';

const REGIONAL_SERVERS: Record<string, string> = {
  europe: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI',
  america: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI',
  oceania: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI',
};

interface TahomaScenario {
  id: string;
  name: string;
}

interface ExtendedConfigProps extends TahomaCloudConfigNodeDef {
  gatewayId?: string;
}

interface ExtendedCredentials extends TahomaCloudCredentials {
  userId?: string;
  userPassword?: string;
}

interface OAuthTestRequest {
  configNodeId?: string;
  authMethod?: 'legacy' | 'oauth';
  userId?: string;
  userPassword?: string;
  region?: string;
  gatewayId?: string;
}

/**
 * Extract useful diagnostic information from an unknown error.
 *
 * Never deliberately include credentials, access tokens or
 * refresh tokens in logs.
 */
const getErrorDetails = (
  error: unknown,
): {
  message: string;
  code?: string;
  status?: number;
} => {
  const err = error as {
    message?: string;
    code?: string;
    status?: number;
    response?: {
      status?: number;
      data?: {
        error?: string;
      };
    };
  };

  return {
    message: err?.message || 'Unknown error',
    code: err?.code || err?.response?.data?.error,
    status: err?.status || err?.response?.status,
  };
};

/**
 * Return an appropriate HTTP status for an API error.
 */
const getHttpStatus = (error: unknown, fallback: number): number => {
  const status = getErrorDetails(error).status;

  if (status && status >= 400 && status <= 599) {
    return status;
  }

  return fallback;
};

/**
 * Check whether an error indicates an expired or invalid session.
 */
const isAuthenticationError = (error: unknown): boolean => {
  const status = getErrorDetails(error).status;

  return status === 401 || status === 403;
};

/**
 * Safely close an API session without masking the original error.
 */
const safeLogout = (api: SomfyCloudApi): void => {
  try {
    api.logout();
  } catch (error) {
    const details = getErrorDetails(error);

    console.warn(`[TaHoma Cloud] Logout failed: ${details.message}`);
  }
};

/**
 * Persist the complete OAuth session in Node-RED credentials.
 *
 * Node-RED encrypts credentials at rest.
 *
 * The complete session must be saved together because the
 * refresh token is associated with the selected installation.
 */
const persistOAuthCredentials = (
  RED: nodered.NodeAPI,
  nodeId: string,
  existingCredentials: ExtendedCredentials,
  session: ISomfyTokenState,
): void => {
  const nodes = RED.nodes as unknown as {
    addCredentials?: (id: string, credentials: Record<string, string>) => void;
  };

  if (typeof nodes.addCredentials !== 'function') {
    throw new Error('Node-RED credential persistence is unavailable');
  }

  nodes.addCredentials(nodeId, {
    userId: existingCredentials.userId || '',
    userPassword: existingCredentials.userPassword || '',
    refreshToken: session.refreshToken,
    siteOid: session.siteOid,
    gatewayId: session.gatewayId,
    oauthRegion: session.region,
  });

  existingCredentials.refreshToken = session.refreshToken;
  existingCredentials.siteOid = session.siteOid;
  existingCredentials.gatewayId = session.gatewayId;
  existingCredentials.oauthRegion = session.region;
};

/**
 * Convert an OAuth gateway candidate into the public editor format.
 */
const serializeGateway = (
  gateway: ISomfyGatewayCandidate,
): {
  gatewayId: string;
  homeId: string;
  label: string;
  country?: string;
  region: string;
} => ({
  gatewayId: gateway.gatewayId,
  homeId: gateway.homeId,
  label: gateway.label,
  country: gateway.country,
  region: gateway.region,
});

export = (RED: nodered.NodeAPI): void => {
  RED.nodes.registerType(
    'tahoma-cloud-config',
    function (
      this: nodered.Node<ExtendedCredentials>,
      props: ExtendedConfigProps,
    ) {
      RED.nodes.createNode(this, props);

      this['name'] = props.name;
      this['region'] = props.region;
      this['authMethod'] = props.authMethod || 'legacy';
      this['gatewayId'] = props.gatewayId || '';

      const credentials = (this.credentials || {}) as ExtendedCredentials;

      const authMethod = props.authMethod || 'legacy';

      const userId =
        typeof credentials.userId === 'string' ? credentials.userId : undefined;

      const userPassword =
        typeof credentials.userPassword === 'string'
          ? credentials.userPassword
          : undefined;

      const serverUrl = REGIONAL_SERVERS[props.region];

      const savedGatewayId =
        props.gatewayId || credentials.gatewayId || undefined;

      /*
       * Shared API instance.
       *
       * OAuth and legacy authentication use the same public
       * SomfyCloudApi interface.
       */
      let api: SomfyCloudApi | null = null;

      let oauthAuth: SomfyCloudNewAuth | null = null;

      /*
       * Configuration lifecycle.
       */
      let closing = false;

      /*
       * Authentication concurrency.
       */
      let authenticated = false;
      let loginPromise: Promise<void> | null = null;

      /*
       * Scenario cache.
       */
      let scenarios: TahomaScenario[] | null = null;
      let scenariosPromise: Promise<TahomaScenario[]> | null = null;

      /*
       * Authentication initialization.
       */
      if (authMethod === 'oauth') {
        if (userId && userPassword) {
          oauthAuth = new SomfyCloudNewAuth({
            username: userId,
            password: userPassword,
            refreshToken: credentials.refreshToken,
            siteOid: credentials.siteOid,
            gatewayId: savedGatewayId,
            region: credentials.oauthRegion,
          });

          api = new SomfyCloudApi(oauthAuth);

          /*
           * Persist every rotated refresh token.
           *
           * The OAuth implementation invokes this callback
           * after receiving a replacement refresh token.
           */
          oauthAuth.setTokenRefreshCallback(
            async (session: ISomfyTokenState): Promise<void> => {
              if (closing) {
                return;
              }

              persistOAuthCredentials(RED, this.id, credentials, session);

              RED.log.info('[TaHoma Cloud] OAuth session credentials updated');
            },
          );
        }
      } else if (serverUrl && userId && userPassword) {
        api = new SomfyCloudApi(userId, userPassword, serverUrl);
      }

      /**
       * Authenticate only when necessary.
       *
       * Concurrent callers share the same login operation.
       */
      const ensureAuthenticated = async (): Promise<void> => {
        if (!api) {
          throw new Error(
            'Cloud credentials, authentication method or regional server are missing',
          );
        }

        if (closing) {
          throw new Error('TaHoma Cloud configuration is closing');
        }

        if (authenticated && api.hasSession()) {
          return;
        }

        if (loginPromise) {
          return loginPromise;
        }

        loginPromise = (async () => {
          try {
            await api!.login();

            if (closing) {
              throw new Error('TaHoma Cloud configuration is closing');
            }

            /*
             * OAuth login discovers installations.
             *
             * A previously saved gateway is restored by
             * SomfyCloudNewAuth.login().
             */
            if (authMethod === 'oauth' && oauthAuth) {
              if (
                savedGatewayId &&
                oauthAuth.selectedGateway !== savedGatewayId
              ) {
                oauthAuth.selectGateway(savedGatewayId);
              }

              if (!oauthAuth.selectedGateway) {
                const gateways = oauthAuth.availableGateways;

                if (gateways.length === 1) {
                  oauthAuth.selectGateway(gateways[0].gatewayId);
                } else {
                  throw new Error(
                    'No Somfy installation is selected. ' +
                      'Select an installation in the TaHoma Cloud configuration.',
                  );
                }
              }

              /*
               * Save the initial session as well as subsequent
               * refresh-token rotations.
               */
              const session = oauthAuth.toCredentials();

              persistOAuthCredentials(RED, this.id, credentials, session);
            }

            authenticated = true;

            RED.log.info(
              `[TaHoma Cloud] ${authMethod.toUpperCase()} authentication successful`,
            );
          } catch (error) {
            authenticated = false;
            throw error;
          } finally {
            loginPromise = null;
          }
        })();

        return loginPromise;
      };

      /**
       * Retrieve scenarios from Somfy Cloud.
       *
       * A failed authentication request can be retried once
       * because retrieving scenarios does not execute actions.
       */
      const fetchScenarios = async (): Promise<TahomaScenario[]> => {
        if (!api) {
          throw new Error('Cloud credentials or regional server are missing');
        }

        await ensureAuthenticated();

        try {
          const actionGroups = await api.getActionGroups();

          return actionGroups.map((group) => ({
            id: group.oid,
            name: group.label,
          }));
        } catch (error) {
          if (!isAuthenticationError(error)) {
            throw error;
          }

          RED.log.warn(
            '[TaHoma Cloud] Authentication error while retrieving scenarios. Re-authenticating.',
          );

          authenticated = false;

          await ensureAuthenticated();

          return (await api.getActionGroups()).map((group) => ({
            id: group.oid,
            name: group.label,
          }));
        }
      };

      /**
       * Get or refresh scenarios.
       *
       * The cache is replaced only after successful retrieval.
       */
      const retrieveScenarios = async (
        forceRefresh = false,
      ): Promise<TahomaScenario[]> => {
        if (closing) {
          throw new Error('TaHoma Cloud configuration is closing');
        }

        if (!api) {
          throw new Error('Cloud credentials or regional server are missing');
        }

        if (scenarios !== null && !forceRefresh) {
          return scenarios;
        }

        if (scenariosPromise) {
          return scenariosPromise;
        }

        scenariosPromise = (async () => {
          const updatedScenarios = await fetchScenarios();

          if (closing) {
            throw new Error('TaHoma Cloud configuration is closing');
          }

          scenarios = updatedScenarios;

          RED.log.info(
            `[TaHoma Cloud] Scenario cache updated: ${scenarios.length} scenarios`,
          );

          return scenarios;
        })();

        try {
          return await scenariosPromise;
        } catch (error) {
          const details = getErrorDetails(error);

          RED.log.error(
            `[TaHoma Cloud] Unable to retrieve scenarios. ` +
              `Message: ${details.message}, ` +
              `HTTP status: ${details.status || 'N/A'}, ` +
              `Code: ${details.code || 'N/A'}`,
          );

          throw error;
        } finally {
          scenariosPromise = null;
        }
      };

      /**
       * Execute a scenario.
       *
       * Never automatically retry scenario execution.
       */
      const executeScenario = async (
        scenarioId: string,
      ): Promise<{ execId: string }> => {
        if (!api) {
          throw new Error('Cloud credentials or regional server are missing');
        }

        if (
          !scenarioId ||
          typeof scenarioId !== 'string' ||
          !scenarioId.trim()
        ) {
          throw new Error('A valid scenario ID is required');
        }

        if (closing) {
          throw new Error('TaHoma Cloud configuration is closing');
        }

        await ensureAuthenticated();

        try {
          const execution = await api.executeActionGroup(scenarioId);

          return {
            execId: execution.execId,
          };
        } catch (error) {
          if (isAuthenticationError(error)) {
            authenticated = false;

            api.invalidateSession();

            RED.log.warn(
              '[TaHoma Cloud] Authentication error during scenario execution. ' +
                'The execution was not automatically retried.',
            );
          }

          throw error;
        }
      };

      /*
       * Public configuration-node API.
       */

      this['getScenarios'] = (): Promise<TahomaScenario[]> =>
        retrieveScenarios(false);

      this['refreshScenarios'] = (): Promise<TahomaScenario[]> =>
        retrieveScenarios(true);

      this['executeScenario'] = (
        scenarioId: string,
      ): Promise<{ execId: string }> => executeScenario(scenarioId);

      this['getScenarioById'] = async (
        id: string,
      ): Promise<TahomaScenario | undefined> => {
        const availableScenarios = await retrieveScenarios(false);

        return availableScenarios.find((scenario) => scenario.id === id);
      };

      this['isScenarioCacheReady'] = (): boolean => scenarios !== null;

      /*
       * Backward compatibility.
       *
       * Returns the shared API instance.
       * Callers must not independently log in or log out.
       */
      this['createApi'] = api ? () => api : null;

      /*
       * Expose the selected authentication method for
       * other nodes that need to inspect configuration.
       */
      this['getAuthMethod'] = (): 'legacy' | 'oauth' => authMethod;

      /*
       * Initial scenario discovery.
       */
      if (api) {
        retrieveScenarios().catch(() => {
          RED.log.warn(
            '[TaHoma Cloud] Initial scenario discovery failed. ' +
              'Scenarios can be retrieved later using Refresh scenarios.',
          );
        });
      } else {
        RED.log.warn(
          `[TaHoma Cloud] Initialization skipped: ${authMethod} credentials or configuration are missing.`,
        );
      }

      /*
       * Shutdown.
       */
      this.on('close', (removed, done) => {
        closing = true;
        authenticated = false;

        if (api) {
          safeLogout(api);
        }

        if (typeof done === 'function') {
          done();
        }
      });
    },
    {
      credentials: {
        userId: { type: 'text' },
        userPassword: { type: 'password' },
        refreshToken: { type: 'password' },
        siteOid: { type: 'text' },
        gatewayId: { type: 'text' },
        oauthRegion: { type: 'text' },
      },
    },
  );

  /**
   * Test Somfy Cloud connection.
   *
   * Supports both legacy and OAuth authentication.
   *
   * OAuth testing:
   * - First request discovers installations.
   * - Second request validates the selected installation.
   */
  RED.httpAdmin.post('/somfy/cloud/test', async (request, response) => {
    const body = (request.body || {}) as OAuthTestRequest;

    const {
      configNodeId,
      userId: submittedUserId,
      userPassword: submittedPassword,
      region,
      gatewayId,
    } = body;

    const authMethod = body.authMethod || 'legacy';

    const configNode = configNodeId
      ? (RED.nodes.getNode(
          configNodeId,
        ) as nodered.Node<ExtendedCredentials> | null)
      : null;

    const storedCredentials = configNode?.credentials;

    const userId = submittedUserId || storedCredentials?.userId;

    const userPassword = submittedPassword || storedCredentials?.userPassword;

    if (!userId || !userPassword) {
      response.status(HttpResponse.BAD_REQUEST);

      response.json({
        success: false,
        error: 'Missing Somfy email or password',
      });

      return;
    }

    let testApi: SomfyCloudApi | null = null;

    let testAuth: SomfyCloudNewAuth | null = null;

    let authenticated = false;

    try {
      if (authMethod === 'oauth') {
        testAuth = new SomfyCloudNewAuth({
          username: userId,
          password: userPassword,
          refreshToken: storedCredentials?.refreshToken,
          siteOid: storedCredentials?.siteOid,
          gatewayId: gatewayId || storedCredentials?.gatewayId,
          region: storedCredentials?.oauthRegion,
        });

        testApi = new SomfyCloudApi(testAuth);

        await testApi.login();

        authenticated = true;

        const gateways = testAuth.availableGateways.map(serializeGateway);

        /*
         * Return discovered installations when no gateway
         * has yet been selected.
         */
        if (!gatewayId && !testAuth.selectedGateway) {
          response.json({
            success: true,
            authenticated: true,
            gateways,
            scenarioCount: 0,
            message: 'Installations discovered',
          });

          return;
        }

        if (gatewayId) {
          testAuth.selectGateway(gatewayId);
        }

        if (!testAuth.selectedGateway) {
          response.json({
            success: true,
            authenticated: true,
            gateways,
            scenarioCount: 0,
            message: 'Please select a Somfy installation',
          });

          return;
        }

        const actionGroups = await testApi.getActionGroups();

        const session = testAuth.toCredentials();

        response.json({
          success: true,
          authenticated: true,
          gateways,
          selectedGateway: session.gatewayId,
          siteOid: session.siteOid,
          region: session.region,
          scenarioCount: actionGroups.length,
        });

        RED.log.info(
          `[TaHoma Cloud Test] OAuth connection successful. ` +
            `${actionGroups.length} scenarios discovered.`,
        );

        return;
      }

      /*
       * Legacy authentication.
       */
      const serverUrl = REGIONAL_SERVERS[region || 'europe'];

      if (!serverUrl) {
        response.status(HttpResponse.BAD_REQUEST);

        response.json({
          success: false,
          error: 'Invalid regional server',
        });

        return;
      }

      testApi = new SomfyCloudApi(userId, userPassword, serverUrl);

      await testApi.login();

      authenticated = true;

      const actionGroups = await testApi.getActionGroups();

      response.json({
        success: true,
        authenticated: true,
        scenarioCount: actionGroups.length,
      });

      RED.log.info(
        `[TaHoma Cloud Test] Legacy connection successful. ` +
          `${actionGroups.length} scenarios discovered.`,
      );
    } catch (error) {
      const details = getErrorDetails(error);

      RED.log.error(
        `[TaHoma Cloud Test] ${authMethod} connection failed. ` +
          `Message: ${details.message}, ` +
          `HTTP status: ${details.status || 'N/A'}, ` +
          `Code: ${details.code || 'N/A'}`,
      );

      const status = getHttpStatus(
        error,
        authenticated ? HttpResponse.SERVER_ERROR : HttpResponse.UNAUTHORIZED,
      );

      if (!response.headersSent) {
        response.status(status);

        response.json({
          success: false,
          authenticated,
          error: authenticated
            ? 'Authentication successful, but scenario discovery failed'
            : 'Somfy Cloud authentication failed',
          details: details.message,
          code: details.code,
          httpStatus: details.status,
        });
      }
    } finally {
      if (testApi) {
        safeLogout(testApi);
      } else if (testAuth) {
        testAuth.logout();
      }
    }
  });

  /**
   * Retrieve scenarios for an existing configuration node.
   *
   * Normal requests use the shared cache.
   * ?refresh=true forces a cloud retrieval.
   */
  RED.httpAdmin.get(
    '/somfy/cloud/:account/scenarios',
    async (request, response) => {
      const configNode = RED.nodes.getNode(request.params.account);

      if (!configNode) {
        response.status(HttpResponse.BAD_REQUEST);

        response.json({
          error: 'TaHoma Cloud configuration not found',
        });

        return;
      }

      const getScenarios = configNode['getScenarios'] as
        | (() => Promise<TahomaScenario[]>)
        | undefined;

      const refreshScenarios = configNode['refreshScenarios'] as
        | (() => Promise<TahomaScenario[]>)
        | undefined;

      if (!getScenarios || !refreshScenarios) {
        response.status(HttpResponse.BAD_REQUEST);

        response.json({
          error: 'TaHoma Cloud scenario manager is unavailable',
        });

        return;
      }

      try {
        const forceRefresh = request.query?.refresh === 'true';

        const availableScenarios = forceRefresh
          ? await refreshScenarios()
          : await getScenarios();

        response.json({
          scenarios: availableScenarios,
        });
      } catch (error) {
        const details = getErrorDetails(error);

        RED.log.error(
          `[TaHoma Cloud] Unable to retrieve scenarios. ` +
            `Message: ${details.message}, ` +
            `HTTP status: ${details.status || 'N/A'}, ` +
            `Code: ${details.code || 'N/A'}`,
        );

        response.status(getHttpStatus(error, HttpResponse.SERVER_ERROR));

        response.json({
          error: 'Unable to retrieve Somfy scenarios',
          details: details.message,
          code: details.code,
          httpStatus: details.status,
        });
      }
    },
  );
};
