import dedent from 'dedent';
import { ReplyKeyboardMarkup } from 'node-telegram-bot-api';

export const help = (): string => {
  return dedent(`
    🙌 Welcome. This bot helps you to monitor the status of the validators you nominated.

    /add - 🆕 add an address to your watchlist.
    /remove - ✂️ remove an address from your watchlist.
    /list - 
  `);
}

export const addNominator = (): string => {
  return dedent(`
    Please enter your nominator account.
  `);
}

export const tryAgainLater = (): string => {
  return dedent(`
    ❗ Something went wrong, please try again later. Thank you.
  `);
}

export const invalidAccount = (): string => {
  return dedent(`
    The account format is invalid. Please input again.
  `);
}

export const addNominatorOk = (): string => {
  return dedent(`
    🎉 Your nominator account has been added successfully.
  `);
}

export const existNominatorAccount = (): string => {
  return dedent(`
    Your nominator account is already added.
  `);
}

export const noNomiee = (): string => {
  return dedent(`
    Can't retrive any nominee from on-chain data. Please check your nominator account and input again.
  `);
}

export const noNominators = (): string => {
  return dedent(`
    There is no nominator account in your watchlist. Use /add to add a new one?
  `);
}

export const removeAccount = (): string => {
  return dedent(`
    Please select a nominator account.
  `);
}

export const removeKeyboard = (addresses: string[]): ReplyKeyboardMarkup => {
  const buttons = addresses.map(address => [{text: address}]);
  const replyKeyboardMarkup = {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: true
  }
  return replyKeyboardMarkup;
}

export const removeNominatorOk = (): string => {
  return dedent(`
    🎉 Your nominator account has been removed ✂️ successfully.
  `);
}