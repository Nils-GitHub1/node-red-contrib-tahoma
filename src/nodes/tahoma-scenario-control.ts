import * as nodered from 'node-red';
import { TahomaScenarioControlNodeDef } from './tahoma-scenario-control.def';

interface IScenarioControlMessage extends nodered.NodeMessageInFlow {
  payload: unknown;
}

interface IScenarioControlPayload {
  scenarioId?: string;
}

export = (RED: nodered.NodeAPI): void => {
  RED.nodes.registerType(
    'tahoma-scenario-control',
    function (this: nodered.Node, props: TahomaScenarioControlNodeDef) {
      RED.nodes.createNode(this, props);

      this['name'] = props.name;
      this['cloudConfig'] = props.cloudConfig;
      this['scenarioId'] = props.scenarioId;

      const node = this as nodered.Node & {
        on: (
          event: string,
          listener: (msg: IScenarioControlMessage) => void,
        ) => nodered.Node;
      };

      node.on('input', async (msg: IScenarioControlMessage) => {
        try {
          const configNode = RED.nodes.getNode(this['cloudConfig']);

          if (!configNode) {
            throw new Error('TaHoma Cloud configuration not found');
          }

          const executeScenario = configNode['executeScenario'] as
            | ((scenarioId: string) => Promise<{ execId: string }>)
            | undefined;

          if (!executeScenario) {
            throw new Error(
              'TaHoma Cloud scenario execution manager is unavailable',
            );
          }

          const payload = msg.payload as IScenarioControlPayload;

          const scenarioId =
            typeof msg.payload === 'string'
              ? msg.payload
              : payload && typeof payload.scenarioId === 'string'
                ? payload.scenarioId
                : this['scenarioId'];

          if (!scenarioId || typeof scenarioId !== 'string') {
            throw new Error(
              'No scenario selected. Configure a scenario or provide msg.payload.scenarioId',
            );
          }

          this.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'Executing scenario...',
          });

          const execution = await executeScenario(scenarioId);

          msg.payload = {
            scenarioId,
            execId: execution.execId,
          };

          this.status({
            fill: 'green',
            shape: 'dot',
            text: 'Scenario execution requested',
          });

          this.send(msg);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          this.status({
            fill: 'red',
            shape: 'ring',
            text: 'Scenario execution failed',
          });

          this.error(`TaHoma scenario error: ${message}`, msg);
        }
      });
    },
  );
};
