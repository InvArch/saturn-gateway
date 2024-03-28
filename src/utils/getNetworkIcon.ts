import { NetworkIconByCurrency } from "./consts";

export function getNetworkIcon(network: string) {
  return NetworkIconByCurrency[network];
}