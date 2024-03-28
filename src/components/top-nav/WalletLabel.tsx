
import { Show } from "solid-js";
import { matchTypeToIcon } from "../../utils/matchTypeToIcon";
import { matchTypeToLabel } from "../../utils/matchTypeToLabel";

const WalletLabel = (props: { walletType: string | undefined; }) => {
  return <Show when={!!props.walletType}><div class="flex flex-row items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-md p-2">
    <img src={matchTypeToIcon(props.walletType)} alt="wallet-type" width={12} height={12} />
    <span class="xxs:text-xxs sm:text-xs text-saturn-black dark:text-saturn-offwhite">{matchTypeToLabel(props.walletType)?.toUpperCase()}</span>
  </div></Show>;
};

WalletLabel.displayName = "WalletLabel";
export default WalletLabel;