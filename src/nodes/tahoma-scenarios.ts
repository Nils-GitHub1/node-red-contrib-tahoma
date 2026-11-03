import * as nodered from 'node-red';
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
        try {
          const configNode = RED.nodes.getNode(this['cloudConfig']);

          if (!configNode) {
            throw new Error('TaHoma Cloud configuration not found');
          }

          const getScenarios = configNode['getScenarios'] as
            | (() => Promise<{ id: string; name: string }[]>)
            | undefined;

          if (!getScenarios) {
            throw new Error('TaHoma Cloud scenario manager is unavailable');
          }

          this.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'Retrieving scenarios...',
          });

          const actionGroups = await getScenarios();

          const scenarios: ISomfyScenario[] = actionGroups.map((group) => ({
            id: group.id,
            name: group.name,
            oid: group.id,
            label: group.name,
          }));

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
        }
      });
    },
  );
};
