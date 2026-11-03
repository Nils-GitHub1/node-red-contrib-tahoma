import * as nodered from 'node-red';
import { SomfyCloudApi, ISomfyEvent } from '../core/somfy-cloud-api';
import {
  SomfyCloudNewAuth,
  ISomfyTokenState,
  ISomfyGatewayCandidate,
} from '../core/somfy-cloud-new-auth';
import { HttpResponse } from '../enums/http-response.enum';

const REGIONAL_SERVERS: Record<string, string> = {
  europe: 'https://ha101-1.overkiz.com/enduser-mobile-web/enduserAPI',
  america: 'https://ha401-1.overkiz.com/enduser-mobile-web/enduserAPI',
  oceania: 'https://ha201-1.overkiz.com/enduser-mobile-web/enduserAPI',
};

interface TahomaScenario {
  id: string;
  name: string;
}

interface ISomfyExecutionWaiter {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface ExtendedCredentials {
  userId?: string;
  userPassword?: string;

  oauthUserId?: string;
  oauthUserPassword?: string;

  refreshToken?: string;
  siteOid?: string;
  gatewayId?: string;
  oauthRegion?: string;
}

interface ExtendedConfigProps extends nodered.NodeDef {
  name: string;
  authMethod?: 'legacy' | 'oauth';
  region?: string;
  gatewayId?: string;
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
 * Check whether Somfy reports that the event listener no longer exists.
 */
const isMissingEventListenerError = (error: unknown): boolean => {
  const err = error as {
    response?: {
      data?: {
        error?: string;
      };
    };
  };

  return err?.response?.data?.error === 'No registered event listener';
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
 * Check whether stored credentials contain a complete OAuth session.
 */
const hasCompleteOAuthSession = (
  credentials?: ExtendedCredentials,
): boolean => {
  return Boolean(
    credentials?.refreshToken &&
    credentials?.siteOid &&
    credentials?.gatewayId &&
    credentials?.oauthRegion,
  );
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
    function (this: nodered.Node, props: nodered.NodeDef) {
      RED.nodes.createNode(this, props);

      const config = props as ExtendedConfigProps;

      this['name'] = config.name;
      this['region'] = config.region;
      this['authMethod'] = config.authMethod || 'legacy';
      this['gatewayId'] = config.gatewayId || '';

      // Credential access goes here
      const credentials = (this.credentials || {}) as ExtendedCredentials;

      const userId =
        typeof credentials.userId === 'string' ? credentials.userId : '';

      const userPassword =
        typeof credentials.userPassword === 'string'
          ? credentials.userPassword
          : '';

      const authMethod = config.authMethod || 'legacy';

      const serverUrl = REGIONAL_SERVERS[config.region];

      const savedGatewayId =
        config.gatewayId || credentials.gatewayId || undefined;

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
       * Shared scenario execution event monitoring.
       */
      let eventListenerId: string | null = null;
      let eventListenerPromise: Promise<void> | null = null;
      let eventPollingPromise: Promise<void> | null = null;
      const executionWaiters = new Map<string, ISomfyExecutionWaiter>();
      const terminalExecutionEvents = new Map<string, ISomfyEvent>();

      /*
       * Authentication initialization.
       */
      if (authMethod === 'oauth') {
        const hasPasswordCredentials = Boolean(userId && userPassword);
        const hasSavedSession = hasCompleteOAuthSession(credentials);

        if (hasPasswordCredentials || hasSavedSession) {
          oauthAuth = new SomfyCloudNewAuth({
            username: userId || undefined,
            password: userPassword || undefined,
            refreshToken: credentials.refreshToken,
            siteOid: credentials.siteOid,
            gatewayId: credentials.gatewayId,
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
             * OAuth login discovers installations during a fresh
             * password authentication.
             *
             * A restored session already contains its selected
             * installation. If the configured gateway differs,
             * discover installations before changing selection.
             */
            if (authMethod === 'oauth' && oauthAuth) {
              if (savedGatewayId && oauthAuth.gatewayId !== savedGatewayId) {
                await oauthAuth.discoverGateways();

                oauthAuth.selectGateway(savedGatewayId);
              }

              if (!oauthAuth.hasSelectedGateway) {
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
       * Small delay between event polling requests.
       */
      const eventPollingDelay = (milliseconds: number): Promise<void> =>
        new Promise((resolve) => setTimeout(resolve, milliseconds));

      /**
       * Process execution state events.
       */
      const processExecutionEvent = (event: ISomfyEvent): void => {
        if (
          event.name !== 'ExecutionStateChangedEvent' ||
          !event.execId ||
          (event.newState !== 'COMPLETED' && event.newState !== 'FAILED')
        ) {
          return;
        }

        const waiter = executionWaiters.get(event.execId);

        if (waiter) {
          clearTimeout(waiter.timer);
          executionWaiters.delete(event.execId);

          if (event.newState === 'FAILED') {
            waiter.reject(
              new Error(
                `Scenario execution failed. ` +
                  `Execution ID: ${event.execId}. ` +
                  `Failure: ${event.failureType || 'Unknown'}`,
              ),
            );
          } else {
            waiter.resolve();
          }

          return;
        }

        /*
         * Retain terminal events that arrive before their
         * corresponding execution waiter is registered.
         */
        terminalExecutionEvents.set(event.execId, event);

        /*
         * Keep the event buffer bounded.
         */
        if (terminalExecutionEvents.size > 100) {
          const oldestEventId = terminalExecutionEvents.keys().next().value;

          if (oldestEventId) {
            terminalExecutionEvents.delete(oldestEventId);
          }
        }
      };

      /**
       * Register the shared event listener.
       *
       * Only one listener is registered per Cloud configuration.
       */
      const ensureEventListener = async (): Promise<void> => {
        if (!api) {
          throw new Error('Cloud credentials are unavailable');
        }

        await ensureAuthenticated();

        if (eventListenerId) {
          startEventPolling();
          return;
        }

        if (eventListenerPromise) {
          await eventListenerPromise;
          return;
        }

        eventListenerPromise = (async () => {
          eventListenerId = await api!.registerEventListener();

          RED.log.info('[TaHoma Cloud] Execution event listener registered');
        })();

        try {
          await eventListenerPromise;
        } finally {
          eventListenerPromise = null;
        }

        startEventPolling();
      };

      /**
       * Poll execution events using one shared polling loop.
       */
      const startEventPolling = (): void => {
        if (eventPollingPromise || !eventListenerId) {
          return;
        }

        eventPollingPromise = (async () => {
          while (!closing && eventListenerId && api) {
            try {
              const events = await api.fetchEvents(eventListenerId);

              for (const event of events) {
                processExecutionEvent(event);
              }
            } catch (error) {
              if (isMissingEventListenerError(error)) {
                RED.log.warn(
                  '[TaHoma Cloud] Event listener is no longer registered. Registering a new listener.',
                );

                try {
                  eventListenerId = await api.registerEventListener();

                  RED.log.info(
                    '[TaHoma Cloud] Execution event listener successfully re-registered',
                  );
                } catch (recoveryError) {
                  const details = getErrorDetails(recoveryError);

                  RED.log.error(
                    '[TaHoma Cloud] Event listener recovery failed: ' +
                      details.message,
                  );

                  eventListenerId = null;

                  executionWaiters.forEach((waiter) => {
                    clearTimeout(waiter.timer);
                    waiter.reject(
                      new Error(
                        'Unable to recover Somfy Cloud event monitoring',
                      ),
                    );
                  });

                  executionWaiters.clear();
                  break;
                }
              } else if (isAuthenticationError(error)) {
                authenticated = false;
                api.invalidateSession();

                try {
                  await ensureAuthenticated();

                  eventListenerId = await api.registerEventListener();

                  RED.log.warn(
                    '[TaHoma Cloud] Event listener re-registered after authentication recovery',
                  );
                } catch (recoveryError) {
                  const details = getErrorDetails(recoveryError);

                  RED.log.error(
                    '[TaHoma Cloud] Event listener recovery failed: ' +
                      details.message,
                  );

                  executionWaiters.forEach((waiter) => {
                    clearTimeout(waiter.timer);
                    waiter.reject(
                      new Error(
                        'Unable to recover Somfy Cloud event monitoring',
                      ),
                    );
                  });

                  executionWaiters.clear();
                  eventListenerId = null;
                  break;
                }
              } else {
                const details = getErrorDetails(error);

                RED.log.warn(
                  '[TaHoma Cloud] Event polling failed: ' + details.message,
                );
              }
            }

            await eventPollingDelay(1000);
          }
        })().finally(() => {
          eventPollingPromise = null;
        });
      };

      /**
       * Wait for a particular scenario execution.
       */
      const waitForExecution = (
        execId: string,
        timeoutSeconds: number,
      ): Promise<void> => {
        const previousEvent = terminalExecutionEvents.get(execId);

        if (previousEvent) {
          terminalExecutionEvents.delete(execId);

          if (previousEvent.newState === 'FAILED') {
            return Promise.reject(
              new Error(
                `Scenario execution failed. ` +
                  `Execution ID: ${execId}. ` +
                  `Failure: ${previousEvent.failureType || 'Unknown'}`,
              ),
            );
          }

          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            executionWaiters.delete(execId);

            reject(
              new Error(
                `Scenario execution timed out after ${timeoutSeconds} seconds. ` +
                  `Execution ID: ${execId}`,
              ),
            );
          }, timeoutSeconds * 1000);

          executionWaiters.set(execId, {
            resolve,
            reject,
            timer,
          });
        });
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
            name: group.label.trim(),
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
            name: group.label.trim(),
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
        timeoutSeconds = 0,
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

        if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 0) {
          throw new Error('Scenario timeout must be a non-negative number');
        }

        await ensureAuthenticated();

        /*
         * Register the event listener before executing the scenario.
         * This prevents missing fast execution completion events.
         */
        if (timeoutSeconds > 0) {
          await ensureEventListener();
        }

        try {
          const execution = await api.executeActionGroup(scenarioId);

          if (timeoutSeconds > 0) {
            await waitForExecution(execution.execId, timeoutSeconds);
          }

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
        timeoutSeconds = 0,
      ): Promise<{ execId: string }> =>
        executeScenario(scenarioId, timeoutSeconds);

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

        executionWaiters.forEach((waiter) => {
          clearTimeout(waiter.timer);
          waiter.reject(new Error('TaHoma Cloud configuration is closing'));
        });

        executionWaiters.clear();
        terminalExecutionEvents.clear();

        const cleanup = async (): Promise<void> => {
          if (eventPollingPromise) {
            await eventPollingPromise;
          }

          if (api && eventListenerId) {
            try {
              await api.unregisterEventListener(eventListenerId);

              RED.log.info(
                '[TaHoma Cloud] Execution event listener unregistered',
              );
            } catch (error) {
              const details = getErrorDetails(error);

              RED.log.warn(
                '[TaHoma Cloud] Event listener cleanup failed: ' +
                  details.message,
              );
            }

            eventListenerId = null;
          }

          if (api) {
            safeLogout(api);
          }
        };

        cleanup()
          .catch((error) => {
            const details = getErrorDetails(error);

            RED.log.error(
              '[TaHoma Cloud] Shutdown cleanup failed: ' + details.message,
            );
          })
          .finally(() => {
            if (typeof done === 'function') {
              done();
            }
          });
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

  // Block 2 continues here with the HTTP admin endpoints.

  /**
   * Test Somfy Cloud connection.
   *
   * Supports both legacy and OAuth authentication.
   *
   * OAuth testing:
   * - Discovers installations.
   * - Validates the selected installation.
   * - Supports an existing refresh-token session.
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

    const hasStoredOAuthSession =
      typeof storedCredentials?.refreshToken === 'string' &&
      Boolean(storedCredentials.refreshToken) &&
      typeof storedCredentials?.siteOid === 'string' &&
      Boolean(storedCredentials.siteOid) &&
      typeof storedCredentials?.gatewayId === 'string' &&
      Boolean(storedCredentials.gatewayId) &&
      typeof storedCredentials?.oauthRegion === 'string' &&
      Boolean(storedCredentials.oauthRegion);

    if (authMethod === 'legacy' && (!userId || !userPassword)) {
      response.status(HttpResponse.BAD_REQUEST);

      response.json({
        success: false,
        error: 'Missing Somfy email or password',
      });

      return;
    }

    if (
      authMethod === 'oauth' &&
      (!userId || !userPassword) &&
      !hasStoredOAuthSession
    ) {
      response.status(HttpResponse.BAD_REQUEST);

      response.json({
        success: false,
        error:
          'Somfy email and password, or a valid stored OAuth session, are required',
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

        /*
         * Persist OAuth session changes made during connection testing.
         *
         * An existing configuration node can save rotated refresh
         * tokens immediately. A new, not-yet-deployed configuration
         * uses a temporary test session and saves credentials when
         * the configuration is deployed.
         */
        testAuth.setTokenRefreshCallback(
          async (session: ISomfyTokenState): Promise<void> => {
            if (!configNodeId || !configNode) {
              return;
            }

            const credentialsToPersist: ExtendedCredentials = {
              ...(storedCredentials || {}),
              userId: userId || '',
              userPassword: userPassword || '',
            };

            persistOAuthCredentials(
              RED,
              configNodeId,
              credentialsToPersist,
              session,
            );

            RED.log.info(
              '[TaHoma Cloud Test] OAuth session credentials updated',
            );
          },
        );

        await testApi.login();

        authenticated = true;

        /*
         * Explicitly discover installations.
         *
         * This is important when restoring a previously
         * persisted OAuth session, because login may restore
         * the selected session without performing discovery.
         */
        await testAuth.discoverGateways();

        const gateways = testAuth.availableGateways.map(serializeGateway);

        /*
         * Return discovered installations when no gateway
         * has yet been selected.
         */
        if (!gatewayId && !testAuth.hasSelectedGateway) {
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

        if (!testAuth.hasSelectedGateway) {
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

      testApi = new SomfyCloudApi(userId!, userPassword!, serverUrl);

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
