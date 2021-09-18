import { CronJob } from 'cron';
import { IEventPayouts, IEventSlashes, JobRole } from './interfaces';
import { Db } from './db';
import { ChainData } from './chaindata';
import { apiGetNotificationEvents } from './AxiosHandler';
import { IEventCommissions, NotificationType, IEventStalePayouts } from './interfaces';
import TelegramBot from 'node-telegram-bot-api';
import sha256 from 'crypto-js/sha256';
import { getApiChain } from './utils';

export class Scheduler {
  public role: JobRole;
  private _db: Db;
  private _chainData: ChainData;
  private _botJob: CronJob | null;
  private _telegramBot: TelegramBot
  private _checkingBot: boolean;
  private _eventJob: CronJob | null;
  private _collectingEvent: boolean;
  constructor (role: JobRole, db: Db, chainData: ChainData, telegramBot: TelegramBot) {
    this.role = role;
    this._db = db;
    this._chainData = chainData;
    this._telegramBot = telegramBot;
    this._botJob = null;
    this._checkingBot = false;
    this._eventJob = null;
    this._collectingEvent = false;

    switch(role) {
      case JobRole.bot: 
        this._botJob = new CronJob('*/5 * * * *', async () => {
          if (!this._checkingBot) {
            this._checkingBot = true;
            await this.sendNotifications();
            this._checkingBot = false;
          }
        }, null, true, 'America/Los_Angeles', null, true);
        break;
      case JobRole.event:
        this._eventJob = new CronJob('*/10 * * * *', async () => {
          if (!this._collectingEvent) {
            this._collectingEvent = true;
            await Promise.all([
              this.pollingEvents()
            ])
            this._collectingEvent = false;
          }
        }, null, true, 'America/Los_Angeles', null, true);
        break;
      default: 
        throw new Error(`wrong Job Role: ${role}`);
    }
  }

  start() {
    console.log('start cronjob');
    switch(this.role) {
      case JobRole.bot:
        this._botJob?.start();
      break;
      case JobRole.event:
        this._eventJob?.start();
      break;
      default: 
      throw new Error(`wrong JobRole: ${this.role}`);
    }
  }

  async pollingEvents() {
    console.time('scheduler :: pollingEvents');
    // get current era
    const currentEraKusama = await this._chainData.getActiveEra('Kusama');
    const currentEraPolkadot = await this._chainData.getActiveEra('Polkadot');
    // retrive all nominators
    const chats = await this._db.getAllChats();
    if (chats === null) {
      return;
    }
    chats.forEach(async (chat) => {
      const nominators = await this._db.getAllNominators(chat.id);
      nominators.forEach(async (nominator) => {
        // polling events
        const chain = getApiChain(nominator);
        const events = await apiGetNotificationEvents({
          params: {
            id: nominator,
            chain
          },
          query: {
            from_era: (chain === 'Kusama') ? currentEraKusama - 1 : currentEraPolkadot - 1,
            to_era: (chain === 'Kusama') ? currentEraKusama : currentEraPolkadot
          }
        });
        console.log(nominator);
        console.log(events);
        // insert received events into notification collection
        const { commissions, slashes, inactive, stalePayouts, payouts } = events;
        await this.insertCommissionEvent(chat.id, nominator, commissions);
        await this.insertSlashEvent(chat.id, nominator, slashes);
        await this.insertInactiveEvent(chat.id, nominator, inactive);
        await this.insertStalePayoutEvent(chat.id, nominator, stalePayouts);
        await this.insertPayoutEvent(chat.id, nominator, payouts);
      });
    });
    console.timeEnd('scheduler :: pollingEvents');
  }

  async insertCommissionEvent(chatId: number, nominator: string, events: IEventCommissions[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`${chatId}.${nominator}.${e.era}.${e.address}.${e.commissionFrom}.${e.commissionTo}`);
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `Commission Event: ${nominator} => ${e.era}.${e.address}.${e.commissionFrom}.${e.commissionTo}`,
        sent: false
      });
    })
  }

  async insertSlashEvent(chatId: number, nominator: string, events: IEventSlashes[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`${chatId}.${nominator}.${e.era}.${e.validator}.${e.total}`);
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `Slashes Event: ${nominator} => ${e.era}.${e.validator}.${e.total}`,
        sent: false
      });
    });
  }

  async insertInactiveEvent(chatId: number, nominator: string, events: number[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`${chatId}.${nominator}.${e}`);
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `Inactive Event: ${nominator} => ${e}`,
        sent: false
      });
    })
  }

  async insertStalePayoutEvent(chatId: number, nominator: string, events: IEventStalePayouts[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`${chatId}.${nominator}.${e.era}.${e.address}.${e.unclaimedPayoutEras.join()}`);
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `StalePayout Event: ${nominator} => ${e.address}: ${e.unclaimedPayoutEras.join(' ')}`,
        sent: false
      })
    });
  }

  async insertPayoutEvent(chatId: number, nominator: string, events: IEventPayouts[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`${chatId}.${nominator}.${e.era}.${e.address}${e.amount}`);
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `Payout event: ${nominator} => ${e.era} ${e.address} ${e.amount}`,
        sent: false
      })
    });
  }

  async sendNotifications() {
    console.time('scheduler :: sendNotifications');
    const unsent = await this._db.getUnsentNotifications();
    if (unsent !== null) {
      for (let n of unsent) {
        await this._telegramBot.sendMessage(n.chatId.valueOf(), n.message.toString());
        if (n._id) {
          await this._db.updateNotificationToSent(n._id.toString());
        }
        console.log(`sent:`);
        console.log(`${n.message}`);
      }
    }
    console.timeEnd('scheduler :: sendNotifications');
  }
}