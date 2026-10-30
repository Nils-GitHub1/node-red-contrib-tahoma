import * as nodered from 'node-red';
import { SomfyCloudApi } from '../core/somfy-cloud-api';
import { TahomaScenariosNodeDef } from './tahoma-scenarios.def';

interface ISomfyScenario {
  id: string;
  name: string;
  oid: string;
  label: string;
}

export = (RED: nodered.NodeAPI): void => {
  RED.nodes.registerType(
    'tahoma-scenarios',
    function (this: nodered.Node, props: TahomaScenariosNodeDef) {
      RED.nodes.createNode(this, props);

      this['name'] = props.name;
      this['cloudConfig'] = props.cloudConfig;

      this.on('input', async (msg: nodered.NodeMessageInFlow) => {
        let api: SomfyCloudApi | undefined;

        try {
          const configNode = RED.nodes.getNode(this['cloudConfig']);

          if (!configNode) {
            throw new Error('TaHoma Cloud configuration not found');
          }

          const createApi = configNode['createApi'] as
            | (() => SomfyCloudApi)
            | null;

          if (!createApi) {
            throw new Error(
              'TaHoma Cloud credentials or regional server are missing',
            );
          }

          api = createApi();

          this.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'Connecting to Somfy Cloud...',
          });

          await api.login();

          const actionGroups = await api.getActionGroups();

          const scenarios: ISomfyScenario[] = actionGroups.map((group) => {
            if (!group.oid || !group.label) {
              throw new Error('Invalid scenario returned by Somfy Cloud');
            }

            return {
              id: group.oid,
              name: group.label,
              oid: group.oid,
              label: group.label,
            };
          });

          msg.payload = scenarios;

          this.status({
            fill: 'green',
            shape: 'dot',
            text: `${scenarios.length} scenario(s) found`,
          });

          this.send(msg);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          this.status({
            fill: 'red',
            shape: 'ring',
            text: 'Cloud error',
          });

          this.error(`TaHoma scenarios error: ${message}`, msg);
        } finally {
          if (api) {
            api.logout();
          }
        }
      });
    },
  );
};
