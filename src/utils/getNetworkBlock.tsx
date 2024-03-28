import { NetworkEnum } from "./consts";
import { getAssetIcon } from "./getAssetIcon";

export function getNetworkBlock(network: NetworkEnum) {
  try {
    if (!network) {
      throw new Error('Network is not defined.');
    }

    switch (network) {
      case NetworkEnum.KUSAMA:
        return <>
          <img src={getAssetIcon('KSM')} alt={NetworkEnum.KUSAMA} width={20} height={13} class="mr-2 block" />
          <span>Kusama</span>
        </>;
      case NetworkEnum.POLKADOT:
        return <>
          <img src={getAssetIcon('DOT')} alt={NetworkEnum.POLKADOT} width={25} height={25} class="mr-1 block" />
          <span>Polkadot</span>
        </>;
      case NetworkEnum.TINKERNET:
        return <>
          <img src={getAssetIcon('TNKR')} alt={NetworkEnum.TINKERNET} width={20} height={20} class="mr-2 block" />
          <span>Tinkernet</span>
        </>;
      case NetworkEnum.BASILISK:
        return <>
          <img src={getAssetIcon('BSX')} alt={NetworkEnum.BASILISK} width={20} height={20} class="mr-2 block" />
          <span>Basilisk</span>
        </>;
      default:
        return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}