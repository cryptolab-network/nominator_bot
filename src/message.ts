import dedent from 'dedent';

export const help = (): string => {
  return dedent(`
    🙌 Welcome. This bot helps you to monitor the status of the validators you nominated.

    /add address - 🆕 add an address to your watchlist.
    /remove - ✂️ remove an address from your watchlist.
  `);
}

export const addAccount = (): string => {
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

export const successAddAccount = (): string => {
  return dedent(`
    🎉 Your nominator account has been added.
  `);
}

export const existAccount = (): string => {
  return dedent(`
    The account is already in the watchlist.
  `);
}