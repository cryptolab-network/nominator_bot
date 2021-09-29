import { Balance } from '@polkadot/types/interfaces';
import { IEvent } from '@polkadot/types/types';

export enum ChatState {
  idle = 'idle',
  add = 'add',
  remove = 'remove',
  list = 'list',
  setDisplayName = 'setdisplayname',
  setDisplayNameContinue = 'setdisplaynamecontinue',
  setEvents = 'setevents',
}

export enum Commands {
  setdisplayname = 'Setup a display name for added nominator.',
  setevents = 'Turn on/off event notifications'
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

export enum SetEventCallback {
  toggleCommission = 'toggleCommission',
  toggleSlash = 'toggleSlash',
  toggleInactive = 'toggleInactive',
  toggleStalePayout = 'toggleStalePayout',
  togglePayout = 'togglePayout',
  toggleKick = 'toggleKick',
  toggleChill = 'toggleChill',
  toggleOverSubscribe = 'toggleOverSubscribe',
  done = 'done'
}
export interface IChat {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  type: string;
  state: ChatState;
  state_data: {
    setdisplaynameAddress: string;
  },
  sendCommissions: boolean,
  sendSlashes: boolean,
  sendInactives: boolean,
  sendStalePayouts: boolean,
  sendPayouts: boolean,
  sendKicks: boolean,
  sendChills: boolean,
  sendOverSubscribes: boolean,
}

export interface INominatorDb {
  chatId: number,
  address: string,
  displayname: string,
  targets: [string]
}

export interface INominatorChainData {
  address: string,
  bonded: string | undefined,
  active: string | undefined,
  rewardDestination: string,
  totalNominees: number
}

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

export interface IKicks {
  era: number;
  address: string;
  nominator: string;
}

export interface IChills {
  era: number;
  address: string;
}

export interface IOverSubscribes {
  era: number;
  address: string;
}

export interface IEventsInfo {
  commissions: IEventCommissions[];
  slashes: IEventSlashes[];
  inactive: number[];
  stalePayouts: IEventStalePayouts[];
  payouts: IEventPayouts[];
  kicks: IKicks[];
  chills: IChills[];
  overSubscribes: IOverSubscribes[];
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
