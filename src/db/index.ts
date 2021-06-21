import mongoose from 'mongoose';
import { ClientSchema } from './models';
import { IClient, ITg } from '../interfaces';

export class Db {
  private _clientModel: any;

  constructor() {
    this._clientModel = mongoose.model('Client', ClientSchema);
  }

  async connect(uri: string): Promise<void> {
    mongoose.connect(uri, {
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      useFindAndModify: false
    });

    return new Promise((resolve, reject) => {
      mongoose.connection.once('open', async () => {
        console.log(`Db connected.`);
        resolve();
      });
      mongoose.connection.on('error', (err) => {
        console.log(err.toString());
        reject();
      })
    });
  }

  async updateClient(data: ITg): Promise<boolean> {
    const client = await this._clientModel.findOne({
      'tg.from.id': data.from.id,
      'tg.chat.id': data.chat.id
    }).exec();

    if (!client) {
      const client: any = new this._clientModel({
        tg: data,
        nominators: []
      });
      return client.save();
    } else {
      return true;
    }
  }

}


