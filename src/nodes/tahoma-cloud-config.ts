import * as nodered from 'node-red';
import { SomfyCloudApi } from '../core/somfy-cloud-api';
import { HttpResponse } from '../enums/http-response.enum';
import {
  TahomaCloudConfigNodeDef,
  TahomaCloudCredentials,
} from './tahoma-cloud-config.def';

const REGIONAL_SERVERS: { [key: string]: string } = {
  europe: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI',
  america: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI',
  oceania: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI',
};

interface TahomaScenario {
  id: string;
  name: string;
}

/**
 * Extract useful diagnostic information from an unknown error.
 * Never include credentials or session information in logs.
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
    response?: {
      status?: number;
    };
  };

  return {
    message: err?.message || 'Unknown error',
    code: err?.code,
    status: err?.response?.status,
  };
};

/**
 * Return an appropriate HTTP status for an API error.
 */
const getHttpStatus = (error: unknown, fallback: number): number => {
  const details = getErrorDetails(error);

  if (details.status && details.status >= 400 && details.status <= 599) {
    return details.status;
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

export = (RED: nodered.NodeAPI): void => {
  RED.nodes.registerType(
    'tahoma-cloud-config',
    function (
      this: nodered.Node<TahomaCloudCredentials>,
      props: TahomaCloudConfigNodeDef,
    ) {
      RED.nodes.createNode(this, props);

      this['name'] = props.name;
      this['region'] = props.region;

      const credentials = this.credentials;
      const serverUrl = REGIONAL_SERVERS[props.region];

      /*
       * One API instance per configuration node.
       *
       * All cloud nodes using this configuration share the
       * same SomfyCloudApi instance and authenticated session.
       */
      const api =
        serverUrl && credentials?.userId && credentials?.userPassword
          ? new SomfyCloudApi(
              credentials.userId,
              credentials.userPassword,
              serverUrl,
            )
          : null;

      /*
       * Shared scenario cache.
       *
       * null means that initial discovery has not succeeded yet.
       * An empty array is a valid, successfully retrieved result.
       */
      let scenarios: TahomaScenario[] | null = null;

      /*
       * Authentication state.
       */
      let authenticated = false;
      let loginPromise: Promise<void> | null = null;

      /*
       * Scenario retrieval concurrency control.
       */
      let scenariosPromise: Promise<TahomaScenario[]> | null = null;

      /*
       * Configuration-node lifecycle.
       */
      let closing = false;

      /**
       * Authenticate only when necessary.
       *
       * Concurrent callers share the same login operation.
       * The API instance is never recreated.
       */
      const ensureAuthenticated = async (): Promise<void> => {
        if (!api) {
          throw new Error('Cloud credentials or regional server are missing');
        }

        if (closing) {
          throw new Error('TaHoma Cloud configuration is closing');
        }

        if (authenticated) {
          return;
        }

        if (loginPromise) {
          return loginPromise;
        }

        loginPromise = (async () => {
          try {
            await api.login();
            authenticated = true;

            RED.log.info('[TaHoma Cloud] Authentication successful');
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
       * If the session has expired, authenticate again and retry
       * the read operation once.
       *
       * Scenario retrieval is safe to retry because it does not
       * execute any action on the installation.
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
            '[TaHoma Cloud] Session expired while retrieving scenarios. Re-authenticating.',
          );

          authenticated = false;

          await ensureAuthenticated();

          // Retry scenario retrieval once after authentication.
          return (await api.getActionGroups()).map((group) => ({
            id: group.oid,
            name: group.label,
          }));
        }
      };

      /**
       * Get or refresh scenarios.
       *
       * Normal calls use the cache.
       * Forced refreshes retrieve the latest scenarios.
       *
       * Concurrent retrieval requests share the same Promise.
       * The existing cache is only replaced after successful retrieval.
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

          // Replace the cache only after a successful retrieval.
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
       * Execute a scenario using the shared API instance.
       *
       * IMPORTANT:
       * Execution is deliberately NOT retried after an authentication
       * error. This avoids the risk of executing a scenario twice
       * if the server processed the request but its response failed.
       *
       * The next operation will authenticate again when necessary.
       */
      const executeScenario = async (
        scenarioId: string,
      ): Promise<{ execId: string }> => {
        if (!api) {
          throw new Error('Cloud credentials or regional server are missing');
        }

        if (!scenarioId || typeof scenarioId !== 'string') {
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
            // Mark the session as invalid for the next operation.
            // Do not automatically retry scenario execution.
            authenticated = false;

            RED.log.warn(
              '[TaHoma Cloud] Session expired during scenario execution. ' +
                'The execution was not automatically retried.',
            );
          }

          throw error;
        }
      };

      /*
       * Public configuration-node API.
       *
       * All three cloud nodes use these methods instead of
       * creating independent SomfyCloudApi instances.
       */

      /**
       * Return cached scenarios, discovering them if necessary.
       */
      this['getScenarios'] = (): Promise<TahomaScenario[]> =>
        retrieveScenarios(false);

      /**
       * Force scenario discovery using the existing session.
       */
      this['refreshScenarios'] = (): Promise<TahomaScenario[]> =>
        retrieveScenarios(true);

      /**
       * Execute a scenario through the shared authenticated session.
       */
      this['executeScenario'] = (
        scenarioId: string,
      ): Promise<{ execId: string }> => executeScenario(scenarioId);

      /**
       * Find a scenario by ID.
       */
      this['getScenarioById'] = async (
        id: string,
      ): Promise<TahomaScenario | undefined> => {
        const availableScenarios = await retrieveScenarios(false);

        return availableScenarios.find((scenario) => scenario.id === id);
      };

      /**
       * Check whether the scenario cache has been initialized.
       */
      this['isScenarioCacheReady'] = (): boolean => scenarios !== null;

      /**
       * Backward compatibility with existing nodes.
       *
       * Returns the shared API instance, not a new instance.
       *
       * Callers must NOT independently call login() or logout().
       */
      this['createApi'] = api ? () => api : null;

      /*
       * Initial scenario discovery.
       *
       * Runs once per configuration-node instance.
       * Other cloud nodes reuse the resulting cache.
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
          '[TaHoma Cloud] Scenario discovery skipped: credentials or region missing.',
        );
      }

      /*
       * Configuration-node shutdown.
       *
       * Clear the local session when the configuration node closes.
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
      },
    },
  );

  /**
   * Test Somfy Cloud connection.
   *
   * Uses an independent API instance so that testing credentials
   * does not affect the active configuration node's session/cache.
   */
  RED.httpAdmin.post('/somfy/cloud/test', async (request, response) => {
    const {
      configNodeId,
      userId: submittedUserId,
      userPassword: submittedPassword,
      region,
    } = request.body || {};

    const serverUrl = REGIONAL_SERVERS[region];

    const configNode = configNodeId
      ? (RED.nodes.getNode(
          configNodeId,
        ) as nodered.Node<TahomaCloudCredentials>)
      : null;

    const storedCredentials = configNode?.credentials;

    const userId = submittedUserId || storedCredentials?.userId;
    const userPassword = submittedPassword || storedCredentials?.userPassword;

    if (!userId || !userPassword || !serverUrl) {
      response.status(HttpResponse.BAD_REQUEST);

      response.json({
        success: false,
        error: 'Missing credentials or invalid region',
      });

      return;
    }

    const testApi = new SomfyCloudApi(userId, userPassword, serverUrl);

    let authenticated = false;

    try {
      await testApi.login();

      authenticated = true;

      RED.log.info(
        `[TaHoma Cloud Test] Authentication successful (region: ${region})`,
      );

      const actionGroups = await testApi.getActionGroups();

      RED.log.info(
        `[TaHoma Cloud Test] Successfully retrieved ${actionGroups.length} scenarios`,
      );

      response.json({
        success: true,
        authenticated: true,
        scenarioCount: actionGroups.length,
      });
    } catch (error) {
      const details = getErrorDetails(error);

      RED.log.error(
        `[TaHoma Cloud Test] ${authenticated ? 'Scenario discovery' : 'Authentication'} failed. ` +
          `Message: ${details.message}, ` +
          `HTTP status: ${details.status || 'N/A'}, ` +
          `Code: ${details.code || 'N/A'}`,
      );

      const status = getHttpStatus(
        error,
        authenticated ? HttpResponse.SERVER_ERROR : HttpResponse.UNAUTHORIZED,
      );

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
    } finally {
      safeLogout(testApi);
    }
  });

  /**
   * Retrieve scenarios for an existing configuration node.
   *
   * Normal requests read the shared cache.
   * Requests with ?refresh=true force a new cloud retrieval.
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
