import TelegramBot from 'node-telegram-bot-api';
import { Db } from './db';
import { ITg } from './interfaces';

export class Telegram {
  private _bot: TelegramBot;
  private _db: Db;
  constructor(token: string, db: Db) {
    this._bot = new TelegramBot(token, {polling: true});
    this._db = db;
  }

  async sendMessage (chatId: number, msg: string): Promise<void> {
    try {
      this._bot.sendMessage(chatId, msg);
    } catch (e) {
      console.log(e);
    }
  }

  async start (): Promise<void> {
    this._bot.onText(/\/start/, async (msg: any) => {

      const client: ITg = {
        from: msg.from,
        chat: msg.chat
      }
      try {
        await this._db.updateClient(client);
      } catch (err) {
        console.log(err);
      }
    });

    this._bot.onText(/\/add/, async (msg: any, match: any) => {

    });

    this._bot.on('message', async (msg) => {
      console.log(msg);
    });
  }
}