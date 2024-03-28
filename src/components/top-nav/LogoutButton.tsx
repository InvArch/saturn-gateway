import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import LogoutIcon from "../../assets/icons/logout-icon-15x15.svg";
import { Show, createMemo } from "solid-js";
import { WALLET_ACCOUNTS_MODAL_ID } from "./ConnectWallet";
import { useSaturnContext } from "../../providers/saturnProvider";
import { PROPOSE_MODAL_ID } from "../modals/ProposeModal";
import { useNavigate } from "@solidjs/router";
import { usePriceContext } from "../../providers/priceProvider";
import { useIdentityContext } from "../../providers/identityProvider";
import { useBalanceContext } from "../../providers/balanceProvider";

interface ILogoutButtonProps {
  onClick: () => any;
  cancel?: boolean | undefined;
  proposeModal?: boolean | undefined;
}

const LogoutButton = (props: ILogoutButtonProps) => {
  const selectedAccount = useSelectedAccountContext();
  const saturnContext = useSaturnContext();
  const nav = useNavigate();
  const prices = usePriceContext();
  const identity = useIdentityContext();
  const balances = useBalanceContext();

  const onLogout = (e: Event) => {
    e.preventDefault();

    const accState = selectedAccount.state;
    const accSetter = selectedAccount.setters;
    const satSetter = saturnContext.setters;

    try {
      if (accState.wallet) {
        accState.wallet.disconnect();
      }

      if (accSetter.clearSelected) {
        accSetter.clearSelected();
      }

      if (satSetter.logout) {
        satSetter.logout();
      }

      if (props.onClick) {
        props.onClick();
      }

      window.location.href = '/';
    } catch {
      console.error("Error disconnecting wallet");
    } finally {
      identity.actions.clearIdentities();
      prices.clearPrices();
      balances?.clearBalances();
      console.log('Thank you for choosing the Omniway. Goodbye!');
    }
  };

  return <>
    <Show when={!!selectedAccount.state.account && !props.cancel}>
      <button type="button" data-modal-target={WALLET_ACCOUNTS_MODAL_ID} data-modal-toggle={WALLET_ACCOUNTS_MODAL_ID} onClick={(e) => onLogout(e)} class="p-4 bg-transparent text-sm rounded-md dark:hover:bg-gray-900 hover:bg-gray-200 focus:outline-none text-saturn-lightgrey flex gap-2 items-center flex-row"><span>Logout</span> <img src={LogoutIcon} alt="logout" /></button>
    </Show>
    <Show when={props.cancel}>
      <button type="button" data-modal-target={!props.proposeModal ? WALLET_ACCOUNTS_MODAL_ID : PROPOSE_MODAL_ID} data-modal-toggle={!props.proposeModal ? WALLET_ACCOUNTS_MODAL_ID : PROPOSE_MODAL_ID} onClick={props.onClick} class="p-4 bg-transparent text-sm rounded-md dark:hover:bg-gray-900 hover:bg-gray-200 focus:outline-none text-saturn-lightgrey flex gap-2 items-center flex-row"><span>Cancel</span> <img src={LogoutIcon} alt="logout" /></button>
    </Show>
  </>;
};

LogoutButton.displayName = 'LogoutButton';
export default LogoutButton;