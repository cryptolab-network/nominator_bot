import { ApiHandler } from './ApiHandler';
import { INominatorInfo } from './interfaces';
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

  async getActiveEra(): Promise<number> {
    const api = this._apiHandler.getApi();
    const activeEra = await api.query.staking.activeEra();
    return activeEra.unwrap().index.toNumber();
  }

  // async queryNominatorInfo(address: string): Promise<INominatorInfo> {
  //   const api = this._apiHandler.getApi();
  //   let [balances, bonded, payee] = await Promise.all([
  //     api.derive.balances.all(address),
  //     api.query.staking.bonded(address),
  //     api.query.staking.payee(address)
  //   ]);
  //   const controller = bonded.isNone ? '' : bonded.toString();
  //   return {
  //     address,
  //     controller,
  //     rewardDestination: payee.isStaked ? address : controller,
  //     availableBalance: balances.freeBalance,
  //     freeBalance: balances.freeBalance,
  //     lockedBalance: balances.lockedBalance,
  //     reservedBalance: balances.reservedBalance
  //   }
  // }
}



// api.derive.balances.all
// api.query.staking.bonded --> controller
// api.query.staking.payee --> reward destination, eg. staked, Controller