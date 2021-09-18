const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');

export const verifyAddress = (address: string): boolean => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : decodeAddress(address)
    );
    if (address.length === 47 && address.match(/[C-Z].+/)?.index === 0) {
      return true;
    }
    if ((address.length === 48 || address.length === 47) && address.match(/1+/)?.index === 0) {
      return true;
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const getApiChain = (address: string): string => {
  if (address.length === 47 && address.match(/[C-Z].+/)?.index === 0) {
    return 'KSM'
  } else if ((address.length === 48 || address.length === 47) && address.match(/1+/)?.index === 0) {
    return 'DOT';
  } else {
    return 'None';
  }
}
