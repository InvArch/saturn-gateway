import { WalletNameEnum } from "./consts";

export function matchTypeToLabel(type: string | undefined) {
  if (!type) return;
  const lcType = type.toLowerCase();
  if (WalletNameEnum.SUBWALLET.toLowerCase().includes(lcType)) {
    return WalletNameEnum.SUBWALLET;
  } else if (WalletNameEnum.TALISMAN.toLowerCase().includes(lcType)) {
    return WalletNameEnum.TALISMAN;
  } else if (WalletNameEnum.NOVAWALLET.toLowerCase().includes(lcType)) {
    return WalletNameEnum.NOVAWALLET;
  } else if (WalletNameEnum.PJS.toLowerCase().includes(lcType)) {
    return WalletNameEnum.PJS;
  } else if (WalletNameEnum.CRUSTWALLET.toLowerCase().includes(lcType)) {
    return undefined;
    // return WalletTypeEnum.CRUSTWALLET;
  } else if (WalletNameEnum.SPORRAN.toLowerCase().includes(lcType)) {
    return undefined;
    // return WalletTypeEnum.SPORRAN;
  } else {
    return WalletNameEnum.WALLETCONNECT;
  }
}