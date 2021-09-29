import dedent from 'dedent';
import { ReplyKeyboardMarkup, InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { INominatorInfo, SetEventCallback, INominatorDb, IChat, INominatorChainData } from './interfaces';

export const help = (): string => {
  return dedent(`
    🙌 Welcome. This bot helps you to monitor the status of the validators you nominated.
    Polkadot (DOT) and Kusama (KSM) are both supported.

    /add - 🆕 add a nominator to your watchlist.
    /remove - ✂️ remove a nominator from your watchlist.
    /list - 📖 list added nominators.
    /setdisplayname - ⚙️ change nominator display name.
    /setevents - 🔕 toggle event notifications.
    /web - 🧪 visit the CryptoLab website.
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

export const accountNotFound = (): string => {
  return dedent(`
    The account was not found. Please input again.
  `);
}

export const addNominatorOk = (): string => {
  return dedent(`
    🎉 Your nominator account has been added successfully. check out /list
  `);
}

export const existNominatorAccount = (): string => {
  return dedent(`
    Your nominator account is already added.
  `);
}

export const noNominee = (): string => {
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

export const removeKeyboard = (nominators: INominatorDb[]): ReplyKeyboardMarkup => {
  const buttons = nominators.map((n) => {
    if (n.displayname !== '') {
      return [{text: n.displayname}];
    } else {
      return [{text: n.address}];
    }
  })
  const replyKeyboardMarkup = {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: true
  }
  return replyKeyboardMarkup;
}

export const removeNominatorOk = (): string => {
  return dedent(`
    🎉 Your nominator account has been removed ✂️ successfully. check out /list
  `);
}

export const listAccount = (): string => {
  return dedent(`
    Select an account
  `);
}

export const listKeyboard = (nominators: INominatorDb[]): ReplyKeyboardMarkup => {
  const buttons = nominators.map((n) => {
    // console.log(n);
    if (n.displayname !== '') {
      return [{text: n.displayname}];
    } else {
      return [{text: n.address}];
    }
  })
  const replyKeyboardMarkup = {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: true
  }
  return replyKeyboardMarkup;
}

export const showNomintorInfo = (info: INominatorInfo): string => {
  return JSON.stringify(info, undefined, 1);
}

export const showNomintorChainInfo = (info: INominatorChainData): string => {
  return dedent(`
  🗳️ Account: ${info.address}
  💰 Bonded amount: ${info.bonded}
  ✨ Active amount: ${info.bonded}
  🏦 Reward destination: ${info.rewardDestination}
  🤖 Total nominees: ${info.totalNominees}
  `);
}

export const setDisplayName = (address: string): string => {
  return dedent(`
    OK. Input the new display name for the nominator ${address}.
  `);
}

export const successDisplayName = (): string => {
  return dedent(`
    Success! Display name updated. /help
  `);
}

export const toggleEvents = (): string => {
  return dedent(`
    Select an event.
  `);
}

export const toggleEventsDone = (): string => {
  return dedent(`
    OK.
  `);
}

export const setEventsKeyboard = (chat: IChat): InlineKeyboardMarkup => {
  let buttons = [];
  if (chat.sendCommissions) {
    buttons.push([{text: `🔔 commission change event`, callback_data: SetEventCallback.toggleCommission}]);
  } else {
    buttons.push([{text: `🔕 commission change event`, callback_data: SetEventCallback.toggleCommission}]);
  }

  if (chat.sendInactives) {
    buttons.push([{text: `🔔 all validators inactive event`, callback_data: SetEventCallback.toggleInactive}]);
  } else {
    buttons.push([{text: `🔕 all validators inactive event`, callback_data: SetEventCallback.toggleInactive}]);
  }

  if (chat.sendPayouts) {
    buttons.push([{text: `🔔 payout event`, callback_data: SetEventCallback.togglePayout}]);
  } else {
    buttons.push([{text: `🔕 payout event`, callback_data: SetEventCallback.togglePayout}]);
  }

  if (chat.sendSlashes) {
    buttons.push([{text: `🔔 slash event`, callback_data: SetEventCallback.toggleSlash}]);
  } else {
    buttons.push([{text: `🔕 slash event`, callback_data: SetEventCallback.toggleSlash}]);
  }

  if (chat.sendStalePayouts) {
    buttons.push([{text: `🔔 stale payout event`, callback_data: SetEventCallback.toggleStalePayout}]);
  } else {
    buttons.push([{text: `🔕 stale payout event`, callback_data: SetEventCallback.toggleStalePayout}]);
  }

  if (chat.sendKicks) {
    buttons.push([{text: `🔔 kick event`, callback_data: SetEventCallback.toggleKick}]);
  } else {
    buttons.push([{text: `🔕 kick event`, callback_data: SetEventCallback.toggleKick}]);
  }

  if (chat.sendChills) {
    buttons.push([{text: `🔔 chill event`, callback_data: SetEventCallback.toggleChill}]);
  } else {
    buttons.push([{text: `🔕 chill event`, callback_data: SetEventCallback.toggleChill}]);
  }

  if (chat.sendOverSubscribes) {
    buttons.push([{text: `🔔 oversubscribe event`, callback_data: SetEventCallback.toggleOverSubscribe}]);
  } else {
    buttons.push([{text: `🔕 oversubscribe event`, callback_data: SetEventCallback.toggleOverSubscribe}]);
  }

  buttons.push([{text: 'done', callback_data: SetEventCallback.done}]);

  const inlineKeyboardMarkup = {
    inline_keyboard: buttons
  }
  return inlineKeyboardMarkup;
}

export const visitCryptoLab = (): string => {
  return dedent(`
    CryptoLab is making life way easier for crypto holders. 
    We help you earn staking yield without taking custody of your assets. 
    Stake once, CryptoLab will take care of the rest for you.
    Visit https://www.cryptolab.network for more information.
  `);
}
