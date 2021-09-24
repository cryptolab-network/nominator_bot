import { ApiPromise } from '@polkadot/api';
import { ApiHandler } from './ApiHandler';
import { INominatorChainData } from './interfaces';
export class ChainData {
  private _apiHandler: ApiHandler;
  constructor(apiHandler: ApiHandler) {
    this._apiHandler = apiHandler;
  }

  async queryStakingNominators(address: string): Promise<string[] | null> {
    let api: ApiPromise;
    if (address.match(/1+/)?.index === 0) {
      api = this._apiHandler.getPolkadotApi();
    } else if (address.match(/[C-Z].+/)?.index === 0) {
      api = this._apiHandler.getKusamaApi();
    } else {
      return null;
    }
    const nomination: any = (await api.query.staking.nominators(address)).toJSON();
    if (!nomination) {
      return null;
    }
    const targets = nomination['targets'];
    return targets;
  }

  async getActiveEra(chain: string): Promise<number> {
    let api: ApiPromise;
    if (chain === 'Kusama') {
      api = this._apiHandler.getKusamaApi();
    } else if (chain === 'Polkadot') {
      api = this._apiHandler.getPolkadotApi();
    } else {
      return 0;
    }
    const activeEra = await api.query.staking.activeEra();
    return activeEra.unwrap().index.toNumber();
  }

  async queryStakingAccount(address: string, chain: string): Promise<INominatorChainData | null> {
    let api: ApiPromise;
    if (chain === 'KSM') {
      api = this._apiHandler.getKusamaApi();
    } else if (chain === 'DOT') {
      api = this._apiHandler.getPolkadotApi();
    } else {
      return null;
    }
    const data = await api.derive.staking.account(address);
    const rewardDestination = data.rewardDestination.isStaked
    ? 'Staked'
    : data.rewardDestination.isStash
    ? 'Stash'
    : data.rewardDestination.isController
    ? 'Controller'
    : data.rewardDestination.asAccount.toString()
  
    return {
      address: data.accountId.toHuman(),
      bonded: (data.stakingLedger.total.toHuman()?.toString()),
      active: data.stakingLedger.active.toHuman()?.toString(),
      rewardDestination: rewardDestination,
      totalNominees: data.nominators.length
    }
  }

  // todo: fix this
  async queryIdentity(address: string, chain: string) {
    let api: ApiPromise;
    if (chain === 'KSM') {
      api = this._apiHandler.getKusamaApi();
    } else if (chain === 'DOT') {
      api = this._apiHandler.getPolkadotApi();
    } else {
      return null;
    }
    const identity = await api.query.identity.identityOf(address);
    console.log(identity);
    return identity.value.toString();
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