export enum ChatState {
  idle = 'idle',
  add = 'add',
  delete = 'delete',
}

export enum DbStatusCode {
  success,
  exist,
  error,
}

export interface IChat {
  id: number,
  first_name: string,
  last_name: string,
  username: string,
  type: string,
  state: ChatState
}

export interface INominator {
  chatId: number,
  address: string,
  targets: [string]
}

