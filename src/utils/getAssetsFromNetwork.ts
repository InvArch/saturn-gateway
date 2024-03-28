import { NetworksByAsset } from "../data/rings";
import { NetworkEnum } from "./consts";

// loop through NetworksByAsset and only return the given asset if the network is in the array
export const getAssetsFromNetwork = (network: NetworkEnum) => {
  const assets = [];
  for (const [asset, networks] of Object.entries(NetworksByAsset)) {
    if (networks.includes(network)) {
      assets.push(asset);
    }
  }
  return assets;
};