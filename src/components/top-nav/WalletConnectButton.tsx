import { Account, WalletType } from "@polkadot-onboard/core";
import WalletConnectIcon from "../../assets/icons/walletconnect-logo.svg";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { WalletNameEnum } from "../../utils/consts";
import { useWalletConnectContext } from "../../providers/walletConnectProvider";

const WalletConnectButton = (props: { onClick?: () => any; }) => {
  const [isMatch, setIsMatch] = createSignal(false);
  const saContext = useSelectedAccountContext();
  const wcContext = useWalletConnectContext();

  const wcAccount = createMemo(() => saContext.setters.getSelectedStorage());

  createEffect(() => {
    const client = wcContext.state.w3w;
    if (!client) return;
    const sessions = client.getActiveSessions();
    if (Object.entries(sessions).length === 0) {
      // No active sessions
      setIsMatch(false);
      return;
    }
    const isWcAccountMatch = wcAccount() && wcAccount().wallet === WalletNameEnum.WALLETCONNECT;
    if (isWcAccountMatch()) {
      setIsMatch(true);
    } else {
      setIsMatch(false);
    }
  });

  return (
    <button type="button" class={`${ isMatch() ? 'border-[1.5px] wc-active border-saturn-green' : 'border-saturn-purple' } dark:bg-saturn-purple bg-saturn-purple rounded-md p-4 hover:bg-purple-800 dark:hover:bg-purple-800 focus:outline-none`} onClick={props.onClick}>
      <img src={WalletConnectIcon} alt="wallet-connect-icon" width={135} height={22} />
    </button>
  );
};

WalletConnectButton.displayName = "WalletConnectButton";
export default WalletConnectButton;