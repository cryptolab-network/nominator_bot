import TelegramBot from 'node-telegram-bot-api';
import { Db } from './db';
import { ChatState, IChat, DbStatusCode } from './interfaces';
import { verifyAddress } from './utils';
import { help, addAccount, tryAgainLater, invalidAccount, existAccount, successAddAccount } from './message';

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
      const chat: IChat = {
        id: msg.chat.id,
        first_name: msg.chat.first_name,
        last_name: msg.chat.last_name,
        username: msg.chat.username,
        type: msg.chat.type,
        state: ChatState.idle
      }
      await this._db.updateChat(chat);
      await this.sendMessage(msg.chat.id, help());
    });

    // command: /add address
    this._bot.onText(/\/add (.+)/, async (msg: any, match: any) => {
      console.log(`in /add account`)
      const chatId = msg.chat.id;
      const address = match[1];
      if (!verifyAddress(address)) {
        await this.sendMessage(chatId, invalidAccount());
      } else {
        const status = await this._db.addNominator(chatId, address);
        if (status === DbStatusCode.success) {
          await this.sendMessage(chatId, successAddAccount());
        } else if (status === DbStatusCode.exist){
          await this.sendMessage(chatId, existAccount());
        } else {
          await this.sendMessage(chatId, tryAgainLater());
        }
        await this._db.updateChatStatus(chatId, ChatState.idle);
      }
    });

    this._bot.on('message', async (msg) => {
      console.log(msg);

      const chatId = msg.chat.id;
      const data: string | undefined = msg.text;

      if (data) {
        if (data === '/add') {
          const result = await this._db.updateChatStatus(msg.chat.id, ChatState.add);
          if (result === DbStatusCode.success) {
            await this.sendMessage(chatId, addAccount());
          } else {
            await this.sendMessage(chatId, tryAgainLater());
          }
        } else if (data === '/remove') {

        } else if (!data.includes('/')){
          this.processData(chatId, data);
        } else {

        }
      }
    });
  }

  async processData(chatId: number, data: string): Promise<void> {
    console.log(`processData: ${chatId}, ${data}`);
    const chat = await this._db.getChat(chatId);
    if (!chat) {
      //ignore
    } else {
      switch(chat.state) {
        case ChatState.add: {
          // expect an address
          if (!verifyAddress(data)) {
            await this.sendMessage(chatId, invalidAccount());
          } else {
            const status = await this._db.addNominator(chatId, data);
            if (status === DbStatusCode.success) {
              await this.sendMessage(chatId, successAddAccount());
            } else if (status === DbStatusCode.exist){
              await this.sendMessage(chatId, existAccount());
            } else {
              await this.sendMessage(chatId, tryAgainLater());
            }
            await this._db.updateChatStatus(chatId, ChatState.idle);
          }
        }
        break;
        case ChatState.delete: {

        }
        break;
        default: {
          await this.sendMessage(chatId, help());
        }
      }
    }
  }

}