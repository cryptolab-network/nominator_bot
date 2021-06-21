export interface ITg {
  from: {
    id: number,
    is_bot: boolean,
    first_name: string,
    last_name: string,
    username: string,
    language_code: string,
  },
  chat: {
    id: number,
    first_name: string,
    last_name: string,
    username: string,
    type: string
  }
}
export interface IClient {
  tg: ITg,
  nominators: [{
    address: string
  }]
}