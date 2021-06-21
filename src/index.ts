import { keys } from './config/keys';
import { Telegram } from './telegram';
import { Db } from './db';

const main = async () => {
  const db = new Db();
  await db.connect(`mongodb://${keys.MONGO_USERNAME}:${keys.MONGO_PWD}@${keys.MONGO_URL}:${keys.MONGO_PORT}/${keys.MONGO_DBNAME}`);
  const telegram = new Telegram(keys.TG_TOKEN, db);
  telegram.start();
}

main();
