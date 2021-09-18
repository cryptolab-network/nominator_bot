import { Balance } from '@polkadot/types/interfaces';
import { IEvent } from '@polkadot/types/types';

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

export enum JobRole {
  bot = 'bot',
  event = 'event'
}

export enum EventType {
  commission = 'commission',
  slash = 'slash',
  inactive = 'inactive', 
  stalePayout = 'stalePayout', 
  payout = 'payout'
}

export enum NotificationType {
  event = 'event'
}
export interface IChat {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  type: string;
  state: ChatState;
}

// export interface INominator {
//   chatId: number;
//   address: string;
//   targets: string[];
// }

// export interface INominatorInfo {
//   address: string;
//   nomineeCount?: number;
//   controller: string;
//   rewardDestination: string;
//   availableBalance: Balance;
//   freeBalance: Balance;
//   lockedBalance: Balance;
//   reservedBalance: Balance;
// }

export interface INominatorInfo {
  accountId: string;
  balance: {
    free_balance: number;
    locked_balance: number;
  };
  targets: string[];
  rewards: {
    stash: string;
    eraRewards: {
      era: number;
      amount: number;
      timestamp: number;
      price: number;
      total: number;
    }[];
  };
}
export interface INominatorParams {
  chain: string;
  id: string;
}
export interface INominator {
  params: INominatorParams;
}

export interface IEventCommissions {
  commissionFrom: number;
  commissionTo: number;
  address: string;
  era: number;
}

export interface IEventSlashes {
  era: number;
  validator: string;
  total: number;
}

export interface IEventStalePayouts {
  address: string;
  era: number;
  unclaimedPayoutEras: number[];
}

export interface IEventPayouts {
  era: number;
  amount: number;
  address: string;
}

export interface IEventsInfo {
  commissions: IEventCommissions[];
  slashes: IEventSlashes[];
  inactive: number[];
  stalePayouts: IEventStalePayouts[];
  payouts: IEventPayouts[];
}

export interface IEventQuery {
  from_era: number;
  to_era: number;
}

export interface IEventParams {
  params: {
    id: string;
    chain: string;
  };
  query: IEventQuery;
}

export interface INotification {
  _id?: String,
  type: NotificationType,
  eventHash: String,
  chatId: Number,
  message: String,
  sent: Boolean
}
