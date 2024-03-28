import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

export function isValidPolkadotAddress(address: string) {
  let decodedAddress;
  if (isHex(address)) {
    decodedAddress = hexToU8a(address);
  } else {
    decodedAddress = decodeAddress(address);
  }

  try {
    encodeAddress(decodedAddress);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
