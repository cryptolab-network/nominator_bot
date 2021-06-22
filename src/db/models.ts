import { Schema } from 'mongoose';

export const ChatSchema = new Schema({
  id: Number,
  first_name: String,
  last_name: String,
  username: String,
  type: String,
  state: String
}, {
  timestamps: {}
});

export const NominatorSchema = new Schema({
  chatId: Number,
  address: String,
  targets: [String]
}, {
  timestamps: {}
});

export const ValidatorSchame = new Schema({
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
