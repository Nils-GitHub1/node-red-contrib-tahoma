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

      this['createApi'] =
        serverUrl && credentials?.userId && credentials?.userPassword
          ? () =>
              new SomfyCloudApi(
                credentials.userId,
                credentials.userPassword,
                serverUrl,
              )
          : null;
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
   * Authentication and scenario discovery are reported separately
   * to make troubleshooting easier.
   */
  RED.httpAdmin.post('/somfy/cloud/test', async (request, response) => {
    const {
      configNodeId,
      userId: submittedUserId,
      userPassword: submittedPassword,
      region,
    } = request.body || {};

    const serverUrl = REGIONAL_SERVERS[region];

    // Retrieve existing configuration-node credentials.
    const configNode = configNodeId
      ? (RED.nodes.getNode(
          configNodeId,
        ) as nodered.Node<TahomaCloudCredentials>)
      : null;

    const storedCredentials = configNode?.credentials;

    // Prefer newly entered values.
    // Otherwise, use the credentials stored by Node-RED.
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

    const api = new SomfyCloudApi(userId, userPassword, serverUrl);

    let authenticated = false;

    try {
      // Step 1: Authenticate with Somfy Cloud.
      await api.login();

      authenticated = true;

      RED.log.info(
        `[TaHoma Cloud Test] Authentication successful (region: ${region})`,
      );

      // Step 2: Retrieve available scenarios.
      const actionGroups = await api.getActionGroups();

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
      safeLogout(api);
    }
  });

  /**
   * Retrieve scenarios for an existing TaHoma Cloud configuration node.
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

      const createApi = configNode['createApi'] as (() => SomfyCloudApi) | null;

      if (!createApi) {
        response.status(HttpResponse.BAD_REQUEST);

        response.json({
          error: 'Cloud credentials are missing',
        });

        return;
      }

      const api = createApi();

      try {
        await api.login();

        const actionGroups = await api.getActionGroups();

        response.json({
          scenarios: actionGroups.map((group) => ({
            id: group.oid,
            name: group.label,
          })),
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
      } finally {
        safeLogout(api);
      }
    },
  );
};
