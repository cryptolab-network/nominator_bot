import { keys } from './config/keys';
import { Telegram } from './telegram';
import { Db } from './db';
import { ApiHandler } from './ApiHandler';
import { ChainData } from './chaindata';
import { Scheduler } from './scheduler';
import { JobRole } from './interfaces';
import { program } from 'commander';

const sleep = async (ms:number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

const executeBot = async () => {
  const db = new Db();
  await db.connect(`mongodb://${keys.MONGO_USERNAME}:${keys.MONGO_PWD}@${keys.MONGO_URL}:${keys.MONGO_PORT}/${keys.MONGO_DBNAME}?retryWrites=false`);

  const apiHandler = await ApiHandler.create(keys.API_WSS_KUSAMA, keys.API_WSS_POLKADOT);
  if (!apiHandler) {
    process.exit();
  }
  const chainData = new ChainData(apiHandler);

  const telegram = new Telegram(keys.TG_TOKEN, db, chainData);
  telegram.start();

  sleep(3000);

  const botScheduler = new Scheduler(JobRole.bot, db, chainData, telegram.getBot());
  botScheduler.start();
}

const executeEvent = async () => {
  const db = new Db();
  await db.connect(`mongodb://${keys.MONGO_USERNAME}:${keys.MONGO_PWD}@${keys.MONGO_URL}:${keys.MONGO_PORT}/${keys.MONGO_DBNAME}?retryWrites=false`);

  const apiHandler = await ApiHandler.create(keys.API_WSS_KUSAMA, keys.API_WSS_POLKADOT);
  if (!apiHandler) {
    process.exit();
  }
  const chainData = new ChainData(apiHandler);

  sleep(3000);

  const eventScheduler = new Scheduler(JobRole.event, db, chainData);
  eventScheduler.start();
}

const main = async () => {
  const db = new Db();
  await db.connect(`mongodb://${keys.MONGO_USERNAME}:${keys.MONGO_PWD}@${keys.MONGO_URL}:${keys.MONGO_PORT}/${keys.MONGO_DBNAME}?retryWrites=false`);

  const apiHandler = await ApiHandler.create(keys.API_WSS_KUSAMA, keys.API_WSS_POLKADOT);
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

program
  .version('0.1.0')
  .option('-r, --role <role>', 'choose a role to execute this program, ex., bot or collector')
  .parse(process.argv)


if (program.opts().role === JobRole.bot){
  console.log(`role: bot`);
  executeBot();
} else if (program.opts().role === JobRole.event) {
  console.log(`role: event`);
  executeEvent();
} else {
  main();
}
