import * as nodered from 'node-red';

export interface TahomaScenarioControlNodeDef extends nodered.NodeDef {
  name: string;
  cloudConfig: string;
  scenarioId: string;
}
