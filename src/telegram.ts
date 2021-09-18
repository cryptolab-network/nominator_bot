import TelegramBot from 'node-telegram-bot-api';
import { Db } from './db';
import { ChatState, IChat, DbStatusCode } from './interfaces';
import { verifyAddress, getApiChain } from './utils';
import { help, addNominator, tryAgainLater, invalidAccount, existNominatorAccount, addNominatorOk, noNomiee, noNominators,
  removeAccount, removeKeyboard, removeNominatorOk, listKeyboard, listAccount, showNomintorInfo
} from './message';
import { ChainData } from './chaindata';
import { apiGetInfoNominator } from './AxiosHandler';

export class Telegram {
  private _bot: TelegramBot;
  private _db: Db;
  private _chainData: ChainData;

  constructor(token: string, db: Db, chainData: ChainData) {
    this._bot = new TelegramBot(token, {polling: true});
    this._db = db;
    this._chainData = chainData;
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
      await this._bot.sendMessage(msg.chat.id, help());
    });

    this._bot.on('message', async (msg) => {
      console.log(msg);

      const chatId = msg.chat.id;
      const data: string | undefined = msg.text;

      if (data) {
        if (data === '/add') {
          const result = await this._db.updateChatStatus(chatId, ChatState.add);
          if (result === DbStatusCode.success) {
            await this._bot.sendMessage(chatId, addNominator());
          } else {
            await this._bot.sendMessage(chatId, tryAgainLater());
          }
        } else if (data === '/remove') {
          const nominators = await this._db.getAllNominators(chatId);
          if (nominators.length === 0) {
            await this._bot.sendMessage(chatId, noNominators());
            return;
          }
          const result = await this._db.updateChatStatus(chatId, ChatState.remove);
          if (result === DbStatusCode.success) {
            await this._bot.sendMessage(chatId, removeAccount(), {
              reply_markup: removeKeyboard(nominators),
            });
          } else {
            await this._bot.sendMessage(chatId, tryAgainLater());
          }
        } else if (data === '/list') {
          const nominators = await this._db.getAllNominators(chatId);
          if (nominators.length === 0) {
            await this._bot.sendMessage(chatId, noNominators());
            return;
          }
          const result = await this._db.updateChatStatus(chatId, ChatState.list);
          if (result === DbStatusCode.success) {
            await this._bot.sendMessage(chatId, listAccount(), {
              reply_markup: listKeyboard(nominators),
            });
          } else {
            await this._bot.sendMessage(chatId, tryAgainLater());
          }
        } else if (!data.includes('/')){
          this.processData(chatId, data);
        } else {
          await this._bot.sendMessage(chatId, help());
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
            await this._bot.sendMessage(chatId, invalidAccount());
          } else {
            const targets = await this._chainData.queryStakingNominators(address);
            if (targets.length === 0) {
              // not a nominator account
              await this._bot.sendMessage(chatId, noNomiee());
              // return;
            } else {
              const status = await this._db.addNominator(chatId, address, targets);
              if (status === DbStatusCode.success) {
                await this._bot.sendMessage(chatId, addNominatorOk());
              } else if (status === DbStatusCode.exist){
                await this._bot.sendMessage(chatId, existNominatorAccount());
              } else {
                await this._bot.sendMessage(chatId, tryAgainLater());
              }
            }
            await this._db.updateChatStatus(chatId, ChatState.idle);
          }
        }
        break;
        case ChatState.remove: {
          // expect an address in the watchlist
          const address = data;
          if (!verifyAddress(address)) {
            await this._bot.sendMessage(chatId, invalidAccount());
          } else {
            const status = await this._db.removeNominator(chatId, address);
            if (status === DbStatusCode.success) {
              await this._bot.sendMessage(chatId, removeNominatorOk());
            } else {
              await this._bot.sendMessage(chatId, tryAgainLater());
            }
            await this._db.updateChatStatus(chatId, ChatState.idle);
          }
        }
        break;
        case ChatState.list: {
          // expect an address in the watchlist
          const address = data;
          if (!verifyAddress(address)) {
            await this._bot.sendMessage(chatId, invalidAccount());
          } else {
            const nominator = await this._db.getNominator(chatId, address);
            // let nominatorInfo = await this._chainData.queryNominatorInfo(address);
            const chain = getApiChain(address);
            let nominatorInfo = await apiGetInfoNominator({
              params: {
                chain,
                id: address
              }
            });
            // nominatorInfo.nomineeCount = nominator?.targets.length;
            if (nominator && nominatorInfo) {
              console.log(nominatorInfo);
              await this._bot.sendMessage(chatId, nominatorInfo.targets.join(' '));
            } else {
              await this._bot.sendMessage(chatId, tryAgainLater());
            }
            await this._db.updateChatStatus(chatId, ChatState.idle);
          }
        }
        break;
        default: {
          await this._bot.sendMessage(chatId, help());
        }
      }
    }
  }

  getBot() {
    return this._bot;
  }

}