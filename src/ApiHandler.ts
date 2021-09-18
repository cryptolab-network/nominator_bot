import { ApiPromise, WsProvider } from '@polkadot/api';

export class ApiHandler {
  private _apiKusama: ApiPromise;
  private _apiPolkadot: ApiPromise;
  private constructor(apiKusama: ApiPromise, apiPolkadot: ApiPromise) {
    this._apiKusama = apiKusama;
    this._apiPolkadot = apiPolkadot;
  }

  static async create(endpointKusama: string, endpointPolkadot: string): Promise<ApiHandler | null> {
    try {
      const apiKusama = await ApiPromise.create({
        provider: new WsProvider(endpointKusama, 1000),
      });
      const apiPolkadot = await ApiPromise.create({
        provider: new WsProvider(endpointPolkadot, 1000)
      })
      await apiKusama.isReadyOrError;
      await apiPolkadot.isReadyOrError;
      return new ApiHandler(apiKusama, apiPolkadot);
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  getKusamaApi(): ApiPromise {
    return this._apiKusama;
  }

  getPolkadotApi(): ApiPromise {
    return this._apiPolkadot;
  }
}

