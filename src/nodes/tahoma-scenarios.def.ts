import * as nodered from 'node-red';

export interface TahomaScenariosNodeDef extends nodered.NodeDef {
  name: string;
  cloudConfig: string;
}
