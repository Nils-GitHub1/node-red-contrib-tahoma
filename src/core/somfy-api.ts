import axios, { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { ICommand } from '../interfaces/command';
import { IDevice } from '../interfaces/device';
import { ICommandExecutionResponse } from '../interfaces/command-execution-response';
import { HttpResponse } from '../enums/http-response.enum';
import { Node } from 'node-red';
import * as https from 'https';

export class SomfyApi {
  private configNode: Node;
  private axiosInstance: AxiosInstance;

  static async getSessionId(userId: string, userPwd: string, somfyOverkizSrvUrl: string,) {
    return axios({
      url: `${somfyOverkizSrvUrl}/login`,
      method: 'POST',
      data: `userId=${userId}&userPassword=${userPwd}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then((response: AxiosResponse) => {
        const cookieHeader = response.headers['set-cookie'];
        if (!cookieHeader) {
          return null;
        }

        const sessionCookie = cookieHeader.find((c) =>
          c.startsWith('JSESSIONID'),
        );
        if (!sessionCookie) {
          return null;
        }

        return sessionCookie.substring(
          sessionCookie.indexOf('=') + 1,
          sessionCookie.indexOf(';'),
        );
      })
      .catch(() => null);
  }

  static async getLocalToken(
    userId: string,
    userPwd: string,
    tahomaPin: string,
    somfyOverkizSrvUrl: string,
  ) {
    const sessionId = await SomfyApi.getSessionId(userId, userPwd, somfyOverkizSrvUrl);
    if (sessionId === null) {
      return null;
    }

    const response = await axios({
      url: `${somfyOverkizSrvUrl}/config/${tahomaPin}/local/tokens/generate`,
      method: 'GET',
      headers: {
        Cookie: `JSESSIONID=${sessionId}`,
      },
    });

    const token = response.data.token;
    if (!token) {
      return null;
    }


    await SomfyApi.activateLocalToken(token, tahomaPin, sessionId, somfyOverkizSrvUrl,);
    return token;
  }

  static async activateLocalToken(
    token: string,
    pin: string,
    sessionId: string,
    somfyOverkizSrvUrl: string,
  ) {
    // Current date and time
    const now = new Date();
    return axios({
      url: `${somfyOverkizSrvUrl}/config/${pin}/local/tokens`,
      method: 'POST',
      data: {
        token,
        scope: 'devmode',
        label: 
          'Node RED Instance ' + 
          now.getFullYear() + 
          `${now.getMonth() + 1 < 10 ? '0' : ''}${now.getMonth() + 1}`+ 
          `${now.getDate() < 10 ? '0' : ''}${now.getDate()}` + 
          '-' + 
          now.getHours() + 
          'h' + 
          now.getMinutes() + 
          'm' + 
          now.getSeconds(),
      },
      headers: {
        'Content-Type': 'application/json',
        Cookie: `JSESSIONID=${sessionId}`,
      },
    });
  }

  constructor(configNode: Node) {
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    this.configNode = configNode;

    this.axiosInstance.interceptors.request.use(
      config => {
        config.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  private _request(options: AxiosRequestConfig): Promise<any> {
    return this.axiosInstance(options).then((response: AxiosResponse) => {
      if (response.status !== HttpResponse.OK) {
        return 'http_error';
      }

      return response.data;
    });
  }

  private getAccessToken(): string {
    return this.configNode['token'];
  }

  private getGatewayUrl(): string {
    if (!this.configNode || !this.configNode['url']) {
      return undefined;
    }
    return `${this.configNode['url']}/enduser-mobile-web/1/enduserAPI`;
  }

  public getDevice(device: string): Promise<IDevice> {
    const sanitizedDeviceUrl = encodeURIComponent(device);
    return this._request({
      url: `${this.getGatewayUrl()}/setup/devices/${sanitizedDeviceUrl}`,
      method: 'GET',
    });
  }

  public getDeviceStates(device: string): Promise<Array<{ name: string; value: unknown }>> {
    const sanitizedDeviceUrl = encodeURIComponent(device);
    return this._request({
      url: `${this.getGatewayUrl()}/setup/devices/${sanitizedDeviceUrl}/states`,
      method: 'GET',
    });
  }

  public getDevices(): Promise<IDevice[]> {
    return this._request({
      url: `${this.getGatewayUrl()}/setup/devices`,
      method: 'GET',
    });
  }

  public execute(
    device: string,
    command: ICommand,
  ): Promise<ICommandExecutionResponse> {
    return this._request({
      url: `${this.getGatewayUrl()}/exec/apply`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        label: 'Node-RED Tahoma Command',
        actions: [
          {
            commands: [command],
            deviceURL: device,
          },
        ],
      },
    });
  }

  public getStatusForExecutionId(execId: string) {
    return this._request({
      url: `${this.getGatewayUrl()}/exec/current/${execId}`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
