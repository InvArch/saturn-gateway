import BigNumber from "bignumber.js";

export function formatAsset(balance: string, assetDecimals: number, decimalsToShow: number = 2) {
  return BigNumber(balance).div(BigNumber('10').pow(BigNumber(assetDecimals))).toFormat(2, { decimalSeparator: '.', groupSeparator: ',', groupSize: 3 });
}