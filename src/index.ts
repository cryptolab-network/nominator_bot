import { keys } from './config/keys';
import { Telegram } from './telegram';
import { Db } from './db';
import { ApiHandler } from './ApiHandler';
import { ChainData } from './chaindata';
import { Scheduler } from './scheduler';
import { JobRole } from './interfaces';

const sleep = async (ms:number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

const main = async () => {
  const db = new Db();
  await db.connect(`mongodb://${keys.MONGO_USERNAME}:${keys.MONGO_PWD}@${keys.MONGO_URL}:${keys.MONGO_PORT}/${keys.MONGO_DBNAME}`);

  const apiHandler = await ApiHandler.create(keys.API_WSS);
  if (!apiHandler) {
    process.exit();
  }
  const chainData = new ChainData(apiHandler);

  const telegram = new Telegram(keys.TG_TOKEN, db, chainData);
  telegram.start();

  sleep(3000);

  const eventScheduler = new Scheduler(JobRole.event, db, chainData, telegram.getBot());
  eventScheduler.start();

  const botScheduler = new Scheduler(JobRole.bot, db, chainData, telegram.getBot());
  botScheduler.start();
}

main();
