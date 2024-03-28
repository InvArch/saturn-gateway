import { AssetIconByCurrency } from "./consts";

export function getAssetIcon(asset: string) {
  return AssetIconByCurrency[asset];
}