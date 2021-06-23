import mongoose from 'mongoose';
import { ChatSchema, NominatorSchema } from './models';
import { IChat, ChatState, INominator, DbStatusCode } from '../interfaces';
import { assert } from 'console';

export class Db {
  private _chatModel: any;
  private _nominatorModel: any;

  constructor() {
    this._chatModel = mongoose.model('Chat', ChatSchema);
    this._nominatorModel = mongoose.model('Nominator', NominatorSchema);
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

  async updateChat(data: IChat): Promise<boolean> {
    const chat = await this._chatModel.findOne({data}).exec();

    if (!chat) {
      const chat: any = new this._chatModel(data);
      return chat.save();
    } else {
      return true;
    }
  }

  async updateChatStatus(chatId: number, state: ChatState): Promise<DbStatusCode> {
    try {
      await this._chatModel.findOneAndUpdate({id: chatId}, { $set: { state }});
      return DbStatusCode.success;
    } catch (err) {
      console.log(err);
      return DbStatusCode.error;
    }
  }

  async getChat(chatId: number): Promise<IChat | null> {
    try {
      return await this._chatModel.findOne({id: chatId}).exec();
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async addNominator(chatId: number, address: string, targets: string[]): Promise<DbStatusCode> {
    try {
      const data = {
        chatId,
        address,
        targets
      }
      const nominator = await this._nominatorModel.findOne(data).exec();
      if (nominator) {
        return DbStatusCode.exist;
      }
      await this._nominatorModel.create(data);
      return DbStatusCode.success;
    } catch (err) {
      console.log(err);
      return DbStatusCode.error;
    }
  }

  async getNominators(chatId: number): Promise<string[]> {
    try {
      const nominators = await this._nominatorModel.find({chatId}).exec();
      const addresses = nominators.map((nominator: any) => nominator.address);
      return addresses;
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  async getNominator(chatId: number, address: string): Promise<INominator | null> {
    try {
      const nominator = await this._nominatorModel.findOne({chatId, address}).exec();
      return nominator;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  async removeNominator(chatId: number, address: string): Promise<DbStatusCode> {
    try {
      await this._nominatorModel.findOneAndRemove({chatId, address}).exec();
      return DbStatusCode.success;
    } catch (err) {
      console.log(err);
      return DbStatusCode.error;
    }
  }
}


