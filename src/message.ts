import dedent from 'dedent';

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

export const notNominatorAccount = (): string => {
  return dedent(`
    Can't retrive any nominee from on-chain data. Please check your nominator account and input again.
  `);
}
