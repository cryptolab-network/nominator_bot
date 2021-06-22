import TelegramBot from 'node-telegram-bot-api';
import { Db } from './db';
import { ChatState, IChat, DbStatusCode } from './interfaces';
import { verifyAddress } from './utils';
import { help, addNominator, tryAgainLater, invalidAccount, existNominatorAccount, addNominatorOk, notNominatorAccount } from './message';
import { ChainData } from './chaindata';

export class Telegram {
  private _bot: TelegramBot;
  private _db: Db;
  private _chainData: ChainData;

  constructor(token: string, db: Db, chainData: ChainData) {
    this._bot = new TelegramBot(token, {polling: true});
    this._db = db;
    this._chainData = chainData;
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

    this._bot.on('message', async (msg) => {
      console.log(msg);

      const chatId = msg.chat.id;
      const data: string | undefined = msg.text;

      if (data) {
        if (data === '/add') {
          const result = await this._db.updateChatStatus(msg.chat.id, ChatState.add);
          if (result === DbStatusCode.success) {
            await this.sendMessage(chatId, addNominator());
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
          const address = data;
          if (!verifyAddress(address)) {
            await this.sendMessage(chatId, invalidAccount());
          } else {
            const targets = await this._chainData.queryStakingNominators(address);
            if (targets.length === 0) {
              // not a nominator account
              await this.sendMessage(chatId, notNominatorAccount());
              return;
            }
            const status = await this._db.addNominator(chatId, address, targets);
            if (status === DbStatusCode.success) {
              await this.sendMessage(chatId, addNominatorOk());
            } else if (status === DbStatusCode.exist){
              await this.sendMessage(chatId, existNominatorAccount());
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