import { Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BUTTON_COMMON_STYLE, KusamaFeeAssetEnum, TEXT_LINK_STYLE } from "../../utils/consts";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import WalletLabel from "./WalletLabel";
import AvatarAndName from "../legos/AvatarAndName";
import NetworkBalance from "../top-nav/NetworkBalance";
import CopyAddressField from "../legos/CopyAddressField";
import { Modal, initModals, Dropdown } from 'flowbite';
import type { ModalOptions, DropdownOptions, ModalInterface, DropdownInterface } from 'flowbite';
import { FEE_ASSET_MODAL_ID } from "../modals/FeeAssetModal";
import { useMegaModal } from "../../providers/megaModalProvider";

export const WALLET_TOGGLE_ID = 'walletToggle';
export const WALLET_DROPDOWN_ID = 'walletDropdown';
export const WALLET_ACCOUNTS_MODAL_ID = 'walletAccountsModal';
export const FEE_TOGGLE_ID = 'feeToggle';
export const FEE_DROPDOWN_ID = 'feeDropdown';

export const dropdownOptions: DropdownOptions = {
  placement: 'bottom',
  triggerType: 'click',
  offsetSkidding: 0,
  offsetDistance: -7,
  delay: 300,
};

const modalOptions: ModalOptions = {
  backdrop: 'dynamic',
  closable: true,
};

const ConnectWallet = (props: { inMultisig: boolean; isOpen?: (open: boolean) => void; }) => {
  const walletModalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);
  const walletToggleElement = () => document.getElementById(WALLET_TOGGLE_ID);
  const walletDropdownElement = () => document.getElementById(WALLET_DROPDOWN_ID);

  const [accountSelectorModal, setAccountSelectorModal] = createSignal<ModalInterface | null>(null);
  const [connectDropdown, setConnectDropdown] = createSignal<DropdownInterface | null>(null);
  const [isConnectDropdownActive, setIsConnectDropdownActive] = createSignal(false);
  const [feeAsset, setFeeAsset] = createSignal<KusamaFeeAssetEnum>();

  const selectedAccount = useSelectedAccountContext();
  const megaModal = useMegaModal();

  const isInMultisig = createMemo(() => props.inMultisig);
  const isLoggedIn = createMemo(() => !!selectedAccount.state.account?.address);

  const openConnectDropdown = () => {
    if (!isConnectDropdownActive()) {
      connectDropdown()?.show();
      setIsConnectDropdownActive(true);
    } else {
      connectDropdown()?.hide();
      setIsConnectDropdownActive(false);
    }

    if (props.isOpen) {
      props.isOpen(isConnectDropdownActive());
    }
  };

  const openAccountSelectorModal = () => {
    if (!accountSelectorModal()) return;
    if (accountSelectorModal()) {
      if (accountSelectorModal()?.isHidden()) {
        accountSelectorModal()?.show();
      }
    }
  };

  const openFeeAssetModal = () => {
    megaModal.showFeeAssetModal();
  };

  onMount(() => {
    initModals();
  });

  createEffect(() => {
    const selectedAsset = selectedAccount.setters.getFeeAsset() as KusamaFeeAssetEnum;
    setFeeAsset(selectedAsset);
  });

  createEffect(() => {
    if (walletModalElement()) {
      const instance = new Modal(walletModalElement(), modalOptions);
      setAccountSelectorModal(instance);
    }
  });

  createEffect(() => {
    if (walletToggleElement() && walletDropdownElement()) {
      const instance = new Dropdown(walletToggleElement(), walletDropdownElement(), dropdownOptions);
      setConnectDropdown(instance);
    }
  });

  createEffect(() => {
    const handleClickOutside = (event: any) => {
      if (event && walletToggleElement() && walletDropdownElement() && !walletToggleElement()?.contains(event.target) && !walletDropdownElement()?.contains(event.target) && connectDropdown()) {
        setIsConnectDropdownActive(false);
        connectDropdown()?.hide();
      }
    };

    if (isConnectDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  const ConnectButton = () => {
    return <div class={isInMultisig() ? "my-3" : "mx-4 my-3"}>
      <button type="button" onClick={openAccountSelectorModal} data-modal-target={WALLET_ACCOUNTS_MODAL_ID} data-modal-show={WALLET_ACCOUNTS_MODAL_ID} class={`bg-saturn-purple dark:hover:bg-purple-800 hover:bg-purple-900 text-white text-sm rounded-lg py-1.5 px-11 focus:outline-none`}>{selectedAccount.state.account ? 'Change Account' : 'Connect Wallet'}</button>
    </div>;
  };

  return <div class="relative">
    <Show when={!isInMultisig()}>
      <button
        onClick={openConnectDropdown}
        data-dropdown-offset-distance="-6"
        id={WALLET_DROPDOWN_ID}
        data-dropdown-toggle={WALLET_TOGGLE_ID}
        class={`${ BUTTON_COMMON_STYLE } ${ isConnectDropdownActive() ? 'w-60' : '' } text-sm text-saturn-black dark:text-saturn-offwhite h-10 justify-between pl-4 z-30 flex items-center focus:outline-none`}
        type="button">
        <AvatarAndName hide={!isConnectDropdownActive()} enlarge={false} name={selectedAccount.state.account?.name || selectedAccount.state.wallet?.metadata.title} avatar={(selectedAccount.state.account as any)?.avatar} />
        <svg data-accordion-icon class={`transition-all w-3 h-3 ${ isConnectDropdownActive() ? 'rotate-0' : 'rotate-180' } text-saturn-purple relative right-4`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
        </svg>
      </button>
      <div id={WALLET_TOGGLE_ID} class={`${ BUTTON_COMMON_STYLE } hidden rounded-t-none border-t-0 dark:border-t-saturn-black focus:outline-none py-1.5 z-50 flex flex-col w-full`} aria-labelledby={WALLET_DROPDOWN_ID}>
        <Show when={isLoggedIn()}>
          <CopyAddressField address={selectedAccount.state.account?.address} length={10} />
          <dl class="mt-4 text-xs w-full px-5">
            <div class="flex flex-row justify-between mb-5 text-saturn-lightgrey">
              <dt>Balance</dt>
              <dd>
                <NetworkBalance address={selectedAccount.state.account?.address} />
              </dd>
            </div>
            <div class="flex flex-row justify-between mb-5 text-saturn-lightgrey">
              <dt>Wallet</dt>
              <dd class="font-bold"><WalletLabel walletType={selectedAccount.state.wallet?.metadata.title} /></dd>
            </div>
            <div class="flex flex-row justify-between mb-5 text-saturn-lightgrey">
              <dt>Fees paid in</dt>
              <dd class="font-bold text-white">
                <button type="button" class={TEXT_LINK_STYLE} onClick={openFeeAssetModal} data-modal-target={FEE_ASSET_MODAL_ID} data-modal-show={FEE_ASSET_MODAL_ID}>
                  {feeAsset()}
                </button>
              </dd>
            </div>
          </dl>
        </Show>
        <ConnectButton />
      </div>
    </Show>
    <Show when={isInMultisig()}>
      <ConnectButton />
    </Show>
  </div>;
};

ConnectWallet.displayName = 'ConnectWallet';
export default ConnectWallet;