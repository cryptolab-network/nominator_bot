import { keys } from './config/keys';
import { Telegram } from './telegram';
import { Db } from './db';
import { ApiHandler } from './ApiHandler';
import { ChainData } from './chaindata';

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
}

main();
