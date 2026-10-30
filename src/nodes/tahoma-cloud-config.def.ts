import * as nodered from 'node-red';

export interface TahomaCloudConfigNodeDef extends nodered.NodeDef {
  name: string;
  region: string;
}

export interface TahomaCloudCredentials {
  userId: string;
  userPassword: string;
}
