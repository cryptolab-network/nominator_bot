import { Balance } from '@polkadot/types/interfaces';

export enum ChatState {
  idle = 'idle',
  add = 'add',
  remove = 'remove',
  list = 'list',
}

export enum DbStatusCode {
  success,
  exist,
  error,
}

export interface IChat {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  type: string;
  state: ChatState;
}

export interface INominator {
  chatId: number;
  address: string;
  targets: string[];
}

export interface INominatorInfo {
  address: string;
  nomineeCount?: number;
  controller: string;
  rewardDestination: string;
  availableBalance: Balance;
  freeBalance: Balance;
  lockedBalance: Balance;
  reservedBalance: Balance;
}

