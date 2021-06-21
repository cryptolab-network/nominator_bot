import { Schema } from 'mongoose';

export const ClientSchema = new Schema({
  tg: {
    from: {
      id: Number,
      is_bot: Boolean,
      first_name: String,
      last_name: String,
      username: String,
      language_code: String,
    },
    chat: {
      id: Number,
      first_name: String,
      last_name: String,
      username: String,
      type: String
    }
  },
  nominators: [{
    address: String
  }]
}, {
  typeKey: '$type',
  timestamps: {}
});
