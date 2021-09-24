import { Schema } from 'mongoose';

export const ChatSchema = new Schema({
  id: Number,
  first_name: String,
  last_name: String,
  username: String,
  type: String,
  state: String,
  state_data: {
    setdisplaynameAddress: String,
  },
  sendCommissions: Boolean,
  sendSlashes: Boolean,
  sendInactives: Boolean,
  sendStalePayouts: Boolean,
  sendPayouts: Boolean,
}, {
  timestamps: {},
  typeKey: '$type',
});

export const NominatorSchema = new Schema({
  chatId: Number,
  address: String,
  displayname: String,
  targets: [String]
}, {
  timestamps: {},
  typeKey: '$type',
});

export const ValidatorSchema = new Schema({
  chain: String,
  stash: String,
  identity: {
    display: String,
    displayParent: String
  },
  commission: String,
  active: Boolean
}, {
  timestamps: {},
  typeKey: '$type',
})

export const NotificationSchema = new Schema({
  type: String,
  eventHash: String,
  chatId: Number,
  message: String,
  sent: Boolean
}, {
  timestamps: {},
  typeKey: '$type',
})
