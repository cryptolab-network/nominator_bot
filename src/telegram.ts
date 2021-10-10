import TelegramBot from 'node-telegram-bot-api';
import { Db } from './db';
import { ChatState, IChat, DbStatusCode, Commands } from './interfaces';
import { verifyAddress, getApiChain } from './utils';
import { help, addNominator, tryAgainLater, invalidAccount, existNominatorAccount, addNominatorOk, noNominee, noNominators,
  removeAccount, removeKeyboard, removeNominatorOk, listKeyboard, listAccount, setEventsKeyboard, setDisplayName, successDisplayName,
  accountNotFound, toggleEvents, toggleEventsDone, showNomintorChainInfo, visitCryptoLab, nominatorLimit
} from './message';
import { ChainData } from './chaindata';
import { apiGetInfoNominator } from './AxiosHandler';
import { keys } from './config/keys';

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
        state: ChatState.idle,
        state_data: {
          setdisplaynameAddress: ''
        },
        sendCommissions: true,
        sendSlashes: true,
        sendInactives: true,
        sendStalePayouts: true,
        sendPayouts: true,
        sendKicks: true,
        sendChills: true,
        sendOverSubscribes: true,
      }
      await this._db.updateChat(chat);
      await this._bot.sendMessage(msg.chat.id, help());
    });

    this._bot.on('callback_query', async (msg) => {
      const queryId = msg.id;
      const chatId = msg.from.id;
      const data = msg.data;
      let chat = await this._db.getChat(chatId);
      if (data && data === 'done') {
        const result = await this._db.updateChatStatus(chatId, ChatState.idle);
        if (result === DbStatusCode.success) {
          await this._bot.sendMessage(chatId, toggleEventsDone());
        } else {
          await this._bot.sendMessage(chatId, tryAgainLater());
        }
      } else {
        if (data && chat) {
          const result = await this._db.toggleEvents(chat, data);
          const newChat = await this._db.getChat(chatId);
          await this._bot.answerInlineQuery(queryId, [
            {
              type: 'article',
              id: 'id',
              title: data,
              input_message_content: {
                message_text: 'test'
              }
            }
          ]);
          if (newChat) {
            await this._bot.sendMessage(chatId, toggleEvents(), {
              reply_markup: setEventsKeyboard(newChat),
            });
          }
        }
      }
    });

    this._bot.on('message', async (msg) => {
      // console.log(msg);
      console.log(`received msg from ${msg.from?.username}: ${msg.text}`);

      const chatId = msg.chat.id;
      const data: string | undefined = msg.text;

      if (data) {
        if (data === '/add') {
          const nominators = await this._db.getAllNominators(chatId);
          if (nominators.length >= parseInt(keys.NOMINATOR_LIMIT)) {
            await this._bot.sendMessage(chatId, nominatorLimit());
          } else {
            const result = await this._db.updateChatStatus(chatId, ChatState.add);
            if (result === DbStatusCode.success) {
              await this._bot.sendMessage(chatId, addNominator());
            } else {
              await this._bot.sendMessage(chatId, tryAgainLater());
            }
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
        } else if (data === '/setdisplayname') {
          const result = await this._db.updateChatStatus(chatId, ChatState.setDisplayName);
          if (result === DbStatusCode.success) {
            const nominators = await this._db.getAllNominators(chatId);
            if (nominators.length === 0) {
              await this._bot.sendMessage(chatId, noNominators());
              return;
            }
            await this._bot.sendMessage(chatId, listAccount(), {
              reply_markup: listKeyboard(nominators),
            });
          } else {
            await this._bot.sendMessage(chatId, tryAgainLater());
          }
        } else if (data === '/setevents') {
          const chat = await this._db.getChat(chatId);
          const result = await this._db.updateChatStatus(chatId, ChatState.setEvents);
          if (result === DbStatusCode.success && chat) {
            await this._bot.sendMessage(chatId, toggleEvents(), {
              reply_markup: setEventsKeyboard(chat),
            });
          } else {
            await this._bot.sendMessage(chatId, tryAgainLater());
          }
        } else if (data === '/web') {
          await this._bot.sendMessage(chatId, visitCryptoLab());
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
          // expect an address or a display name
          const address = data;
          if (!verifyAddress(address)) {
            await this._bot.sendMessage(chatId, invalidAccount());
          } else {
            const targets = await this._chainData.queryStakingNominators(address);
            if (targets === null) {
              // not a nominator account
              await this._bot.sendMessage(chatId, noNominee());
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
          // expect an address or a display name
          if (!verifyAddress(data)) {
            const nominator = await this._db.getNominatorByDisplayName(chatId, data);
            if (nominator) {
              const status = await this._db.removeNominator(chatId, nominator.address);
              if (status === DbStatusCode.success) {
                await this._bot.sendMessage(chatId, removeNominatorOk());
              } else {
                await this._bot.sendMessage(chatId, tryAgainLater());
              }
            } else {
              await this._bot.sendMessage(chatId, accountNotFound());
            }
          } else {
            const status = await this._db.removeNominator(chatId, data);
            if (status === DbStatusCode.success) {
              await this._bot.sendMessage(chatId, removeNominatorOk());
            } else {
              await this._bot.sendMessage(chatId, tryAgainLater());
            }
          }
          await this._db.updateChatStatus(chatId, ChatState.idle);
        }
        break;
        case ChatState.list: {
          // expect an address or displayname
          if (!verifyAddress(data)) {
            const nominator = await this._db.getNominatorByDisplayName(chatId, data);
            if (nominator) {
              const chain = getApiChain(nominator.address);
              const nominatorChainData = await this._chainData.queryStakingAccount(nominator.address, chain);
              if (nominatorChainData !== null) {
                await this._bot.sendMessage(chatId, showNomintorChainInfo(nominatorChainData));
              } else {
                await this._bot.sendMessage(chatId, tryAgainLater());
              }
            } else {
              await this._bot.sendMessage(chatId, invalidAccount());
            }
          } else {
            const nominator = await this._db.getNominator(chatId, data);
            if (nominator) {
              const chain = getApiChain(nominator.address);
              const nominatorChainData = await this._chainData.queryStakingAccount(nominator.address, chain);
              if (nominatorChainData !== null) {
                await this._bot.sendMessage(chatId, showNomintorChainInfo(nominatorChainData));
              } else {
                await this._bot.sendMessage(chatId, tryAgainLater());
              }
            } else {
              await this._bot.sendMessage(chatId, tryAgainLater());
            }
          }
          await this._db.updateChatStatus(chatId, ChatState.idle);
        }
        break;
        case ChatState.setDisplayName: {
          let nominator = null;
          if (!verifyAddress(data)) {
            nominator = await this._db.getNominatorByDisplayName(chatId, data);

          } else {
            nominator = await this._db.getNominator(chatId, data);
          }
          if (nominator) {
            const result = await this._db.updateChatStatusAndData(chatId, ChatState.setDisplayNameContinue, nominator.address);
            if (result === DbStatusCode.success) {
              await this._bot.sendMessage(chatId, setDisplayName(data));
            } else {
              await this._bot.sendMessage(chatId, tryAgainLater());
            }
          } else {
            console.log(`not found.`);
          }
        }
        break;
        case ChatState.setDisplayNameContinue: {
          // received a display name
          if (data.length > 0) {
            const chat = await this._db.getChat(chatId);
            // console.log(chat);
            if (chat && chat.state_data.setdisplaynameAddress !== '') {
              const result = await this._db.updateNominatorDisplayname(chatId, chat.state_data.setdisplaynameAddress, data);
              if (result === DbStatusCode.success) {
                await this._bot.sendMessage(chatId, successDisplayName());
              } else {
                await this._bot.sendMessage(chatId, tryAgainLater());
              }
              await this._db.updateChatStatus(chatId, ChatState.idle);
            } else {
              await this._db.updateChatStatus(chatId, ChatState.idle);
            }
          } else {
            await this._db.updateChatStatus(chatId, ChatState.idle);
          }
        }
        break;
        case ChatState.setEvents: {
          // console.log(ChatState.setEvents);
          // console.log(data);
          await this._db.updateChatStatus(chatId, ChatState.idle);
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