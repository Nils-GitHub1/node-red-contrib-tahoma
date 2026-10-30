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

  RED.httpAdmin.post('/somfy/cloud/test', async (request, response) => {
    const { userId, userPassword, region } = request.body;
    const serverUrl = REGIONAL_SERVERS[region];

    if (!userId || !userPassword || !serverUrl) {
      response.status(HttpResponse.BAD_REQUEST);
      response.json({
        error: 'Missing credentials or invalid region',
      });
      return;
    }

    const api = new SomfyCloudApi(userId, userPassword, serverUrl);

    try {
      await api.login();
      const actionGroups = await api.getActionGroups();

      response.json({
        success: true,
        scenarioCount: actionGroups.length,
      });
    } catch {
      response.status(HttpResponse.UNAUTHORIZED);
      response.json({
        success: false,
        error: 'Cloud authentication or scenario discovery failed',
      });
    } finally {
      api.logout();
    }
  });

  RED.httpAdmin.get(
    '/somfy/cloud/:account/scenarios',
    async (request, response) => {
      const configNode = RED.nodes.getNode(request.params.account);

      if (!configNode) {
        response.status(HttpResponse.BAD_REQUEST);
        response.json({ error: 'TaHoma Cloud configuration not found' });
        return;
      }

      const createApi = configNode['createApi'] as (() => SomfyCloudApi) | null;

      if (!createApi) {
        response.status(HttpResponse.BAD_REQUEST);
        response.json({ error: 'Cloud credentials are missing' });
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
      } catch {
        response.status(HttpResponse.SERVER_ERROR);
        response.json({
          error: 'Unable to retrieve Somfy scenarios',
        });
      } finally {
        api.logout();
      }
    },
  );
};
