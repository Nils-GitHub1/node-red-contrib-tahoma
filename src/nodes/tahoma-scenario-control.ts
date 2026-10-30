import * as nodered from 'node-red';
import { SomfyCloudApi } from '../core/somfy-cloud-api';
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

      // Register the Node-RED input event.
      // Some versions of the Node-RED typings do not expose
      // the input event in the Node.on() overloads.
      const node = this as nodered.Node & {
        on: (
          event: string,
          listener: (msg: IScenarioControlMessage) => void,
        ) => nodered.Node;
      };

      node.on('input', async (msg: IScenarioControlMessage) => {
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
            throw new Error('TaHoma Cloud credentials are missing');
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

          api = createApi();

          this.status({
            fill: 'yellow',
            shape: 'dot',
            text: 'Connecting to Somfy Cloud...',
          });

          await api.login();

          const execution = await api.executeActionGroup(scenarioId);

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
        } finally {
          if (api) {
            api.logout();
          }
        }
      });
    },
  );
};
