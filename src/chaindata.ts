import { ApiHandler } from './ApiHandler';
export class ChainData {
  private _apiHandler: ApiHandler;
  constructor(apiHandler: ApiHandler) {
    this._apiHandler = apiHandler;
  }

  async queryStakingNominators(address: string): Promise<string[]> {
    const api = this._apiHandler.getApi();
    const nomination: any = (await api.query.staking.nominators(address)).toJSON();
    if (!nomination) {
      return [];
    }
    const targets = nomination['targets'];
    return targets;
  }
}