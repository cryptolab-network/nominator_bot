import { CronJob } from 'cron';
import { IChills, IEventPayouts, IEventSlashes, IKicks, INominatorDb, IOverSubscribes, JobRole } from './interfaces';
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
  private _telegramBot: TelegramBot | undefined;
  private _checkingBot: boolean;
  private _eventJob: CronJob | null;
  private _collectingEvent: boolean;
  constructor (role: JobRole, db: Db, chainData: ChainData, telegramBot?: TelegramBot) {
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
      if (chat.sendCommissions || chat.sendInactives || chat.sendPayouts || chat.sendSlashes || chat.sendStalePayouts || chat.sendKicks || chat.sendChills || chat.sendOverSubscribes) {
        const nominators = await this._db.getAllNominators(chat.id);
        nominators.forEach(async (nominator) => {
          // polling events
          const chain = getApiChain(nominator.address);
          const events = await apiGetNotificationEvents({
            params: {
              id: nominator.address,
              chain
            },
            query: {
              from_era: (chain === 'KSM') ? currentEraKusama - 1 : currentEraPolkadot - 1,
              to_era: (chain === 'KSM') ? currentEraKusama : currentEraPolkadot
            }
          });
          // console.log(nominator);
          // console.log(`chain: ${chain}`);
          // console.log(`from_era: ${(chain === 'KSM') ? currentEraKusama - 32 : currentEraPolkadot - 8}`);
          // console.log(`to_era: ${(chain === 'KSM') ? currentEraKusama : currentEraPolkadot}`);
          // console.log(events);
          // insert received events into notification collection
          const { commissions, slashes, inactive, stalePayouts, payouts, kicks, chills, overSubscribes } = events;

          // const commissions = [{
          //   commissionFrom: 1,
          //   commissionTo: 2.0,
          //   address: 'GA1WBfVMBReXjWKGnXneC682ZZYustFoc8aTsqXv5fFvi2e',
          //   era: 2733,
          // }]

          // const slashes = [{
          //   era: 2733,
          //   validator: 'GhS2L5H1ebHHRDwDMtMtcMyaJsJcncyHDmuUJwHAimifTbx',
          //   total: 2.3
          // }]

          // const inactive = [2733, 2734];
          // const stalePayouts = [{
          //   address: 'D3bm5eAeiRezwZp4tWTX4sZN3u8nXy2Fo21U59smznYHu3F',
          //   era: 2733,
          //   unclaimedPayoutEras: [2600, 2700, 2732]
          // }]
          // const payouts = [{
          //   era: 2733,
          //   amount: 1233141234,
          //   address: 'JBuHBvnqpyb1Qtm7173z4ET1BnmjTMcdDdo7WzbnSbGa4vZ',
          // }]

          // const kicks = [
          //   {
          //     era: 0,
          //     address: '1213241341344adsfadf',
          //     nominator: '124dserqwerqef'
          //   }
          // ];
          // const chills = [
          //   {
          //     era: 0,
          //     address: 'dfasdfasdfasdf'
          //   }
          // ]
          // const overSubscribes = [
          //   {
          //     era: 0,
          //     address: 'asdfasdf',
          //     amount: '982746378921',
          //     nominator: 'sdfasdfdfasdf'
          //   }
          // ]

          if (chat.sendCommissions && commissions) {
            await this.insertCommissionEvent(chat.id, nominator, commissions);
          }

          if (chat.sendInactives && inactive) {
            await this.insertInactiveEvent(chat.id, nominator, inactive);
          }

          if (chat.sendPayouts && payouts) {
            await this.insertPayoutEvent(chat.id, nominator, payouts, chain);
          }

          if (chat.sendSlashes && slashes) {
            await this.insertSlashEvent(chat.id, nominator, slashes, chain);
          }
          
          if (chat.sendStalePayouts && stalePayouts) {
            await this.insertStalePayoutEvent(chat.id, nominator, stalePayouts);
          }

          if (chat.sendKicks && kicks) {
            await this.insertKickEvent(chat.id, nominator, kicks);
          }

          if (chat.sendChills && chills) {
            await this.insertChillEvent(chat.id, nominator, chills);
          }

          if (chat.sendOverSubscribes && overSubscribes) {
            await this.insertOverSubscribeEvent(chat.id, nominator, overSubscribes, chain);
          }
        });
      }
    });
    console.timeEnd('scheduler :: pollingEvents');
  }

  async insertCommissionEvent(chatId: number, nominator: INominatorDb, events: IEventCommissions[]) {
    events.forEach(async (e) => {
      if (e.commissionFrom !== 0) {
        const eventHash = sha256(`Commission.${chatId}.${nominator.address}.${e.era}.${e.address}.${e.commissionFrom}.${e.commissionTo}`);
        const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
        // const chain = getApiChain(nominator.address);
        // const identity = await this._chainData.queryIdentity(nominator.address, chain);
        // console.log(identity);
        await this._db.addNotification({
          type: NotificationType.event,
          eventHash: eventHash.toString(),
          chatId: chatId,
          message: `〽️ [Commission Event] to ${account}: the nominee ${e.address} change its commission from ${e.commissionFrom}% to ${e.commissionTo}%`,
          sent: false
        });
      }
    })
  }

  async insertSlashEvent(chatId: number, nominator: INominatorDb, events: IEventSlashes[], chain: string) {
    events.forEach(async (e) => {
      const eventHash = sha256(`Slash.${chatId}.${nominator.address}.${e.era}.${e.validator}.${e.total}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      const decimal = (chain === 'KSM') ? 12 : 10;
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `💸 [Slashes Event] to ${account}: the nominee ${e.validator} gets slashed ${e.total * 1.0 / 10**decimal} ${chain} at era ${e.era}.`,
        sent: false
      });
    });
  }

  async insertInactiveEvent(chatId: number, nominator: INominatorDb, events: number[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`Inactive.${chatId}.${nominator.address}.${e}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `⏸️ [Inactive Event] to ${account}: all nominees are inactive.`,
        sent: false
      });
    })
  }

  async insertStalePayoutEvent(chatId: number, nominator: INominatorDb, events: IEventStalePayouts[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`StalePayout.${chatId}.${nominator.address}.${e.era}.${e.address}.${e.unclaimedPayoutEras.join()}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      // const chain = getApiChain(nominator.address);
      // const identity = await this._chainData.queryIdentity(nominator.address, chain);
      // console.log(identity);
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `💤 [Stale Payout Event] to ${account}: the nominee ${e.address} has unclaimed payouts at ${e.unclaimedPayoutEras.join(' ')} era`,
        sent: false
      })
    });
  }

  async insertPayoutEvent(chatId: number, nominator: INominatorDb, events: IEventPayouts[], chain: string) {
    events.forEach(async (e) => {
      const eventHash = sha256(`Payout.${chatId}.${nominator.address}.${e.era}.${e.address}${e.amount}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      const decimal = (chain === 'KSM') ? 12 : 10;
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `💰 [Payout Event] to ${account}: received ${e.amount.toLocaleString('fullwide', {useGrouping:false, maximumSignificantDigits: decimal})} ${chain} at era ${e.era}`,
        sent: false
      })
    });
  }

  async insertKickEvent(chatId: number, nominator: INominatorDb, events: IKicks[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`Kick.${chatId}.${nominator.address}.${e.era}.${e.address}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `🔥🔥 [Kick Event] to ${account}: has kicked by the validator ${e.address}`,
        sent: false
      })
    });
  }

  async insertChillEvent(chatId: number, nominator: INominatorDb, events: IChills[]) {
    events.forEach(async (e) => {
      const eventHash = sha256(`Chill.${chatId}.${nominator.address}.${e.era}.${e.address}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `🥶 [Chill Event] to ${account}: the validator ${e.address} is chilled.`,
        sent: false
      })
    });
  }

  async insertOverSubscribeEvent(chatId: number, nominator: INominatorDb, events: IOverSubscribes[], chain: string) {
    events.forEach(async (e) => {
      const eventHash = sha256(`Chill.${chatId}.${nominator.address}.${e.era}.${e.address}`);
      const account = (nominator.displayname !== '') ? nominator.displayname : nominator.address;
      const decimal = (chain === 'KSM') ? 12 : 10;
      await this._db.addNotification({
        type: NotificationType.event,
        eventHash: eventHash.toString(),
        chatId: chatId,
        message: `💸 [Oversubscribe Event] to ${account}: your ${parseInt(e.amount) * 1.0 / 10 ** decimal} ${chain} is oversubscribed on the validator ${e.address}.`,
        sent: false
      })
    });
  }

  async sendNotifications() {
    console.time('scheduler :: sendNotifications');
    const unsent = await this._db.getUnsentNotifications();
    if (unsent !== null) {
      for (let n of unsent) {
        try {
          await this._telegramBot?.sendMessage(n.chatId.valueOf(), n.message.toString());
          if (n._id) {
            await this._db.updateNotificationToSent(n._id.toString());
          }
          console.log(`sent:`);
          console.log(`${n.message}`);
        } catch (error) {
          console.log(`failed to send notification: ${n.chatId.valueOf()} - ${n.message.toString()}`);
        }
      }
    }
    console.timeEnd('scheduler :: sendNotifications');
  }
}