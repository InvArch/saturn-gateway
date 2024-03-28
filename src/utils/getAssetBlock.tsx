import { AssetEnum } from "../data/rings";
import { NetworkEnum } from "./consts";
import { getAssetIcon } from "./getAssetIcon";

export function getAssetBlock(asset: AssetEnum) {
  try {
    if (!asset) {
      throw new Error('Network is not defined.');
    }

    switch (asset) {
      case AssetEnum.KSM:
        return <>
          <img src={getAssetIcon(AssetEnum.KSM)} alt={AssetEnum.KSM} width={20} height={13} class="mr-2 block" />
          <span>{AssetEnum.KSM}</span>
        </>;
      case AssetEnum.DOT:
        return <>
          <img src={getAssetIcon(AssetEnum.DOT)} alt={AssetEnum.DOT} width={25} height={25} class="mr-1 block" />
          <span>{AssetEnum.DOT}</span>
        </>;
      case AssetEnum.TNKR:
        return <>
          <img src={getAssetIcon(AssetEnum.TNKR)} alt={AssetEnum.TNKR} width={20} height={20} class="mr-2 block" />
          <span>{AssetEnum.TNKR}</span>
        </>;
      case AssetEnum.BSX:
        return <>
          <img src={getAssetIcon(AssetEnum.BSX)} alt={AssetEnum.BSX} width={15} height={15} class="mr-2 block" />
          <span>{AssetEnum.BSX}</span>
        </>;
      case AssetEnum.PICA:
        return <>
          <img src={getAssetIcon(AssetEnum.PICA)} alt={AssetEnum.PICA} width={12} height={12} class="mr-2 block bg-saturn-black" />
          <span>{AssetEnum.PICA}</span>
        </>;
      default:
        return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}