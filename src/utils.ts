const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
import { keys } from './config/keys';

export const verifyAddress = (address: string): boolean => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : decodeAddress(address)
    );
    console.log(`address = ${address}`);
    if (keys.CHAIN === 'Kusama') {
      return (address.length === 47 && address.match(/[C-Z].+/)?.index === 0);
    } else if (keys.CHAIN === 'Polkadot') {
      return ((address.length === 48 || address.length === 47) && address.match(/1+/)?.index === 0);
    }
    return false;
  } catch (error) {
    return false;
  }
}

// const isKusamaAddress = (address: string): boolean => {
//   if (address.length === 47 && address.match(/[C-Z].+/)?.index === 0) {
//     return true;
//   } else {
//     return false;
//   }
// }

// const isPolkadotAddress = (address: string): boolean => {
//   if (address.length === 48 && address.match(/1+/)?.index === 0) {
//     return true;
//   } else {
//     return false;
//   }
// }
