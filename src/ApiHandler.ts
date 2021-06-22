import { ApiPromise, WsProvider } from '@polkadot/api';

export class ApiHandler {
  private _api: ApiPromise;
  private _endpoints: string;
  constructor(api: ApiPromise, endpoints: string) {
    this._api = api;
    this._endpoints = endpoints;
  }

  static async create(endpoints: string): Promise<ApiHandler | null> {
    try {
      const api = await ApiPromise.create({
        provider: new WsProvider(endpoints, 1000),
      });
      await api.isReadyOrError;
      return new ApiHandler(api, endpoints);
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  getApi(): ApiPromise {
    return this._api;
  }
}

