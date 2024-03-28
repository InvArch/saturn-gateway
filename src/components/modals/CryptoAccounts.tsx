import { For, onMount, createMemo, createSignal, Show, createEffect, onCleanup, on } from "solid-js";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import WalletLabel from "../top-nav/WalletLabel";
import CopyAddressField from "../legos/CopyAddressField";
import { useThemeContext } from "../../providers/themeProvider";
import NetworkBalance from "../top-nav/NetworkBalance";
import AvatarAndName from "../legos/AvatarAndName";
import WalletConnectButton from "../top-nav/WalletConnectButton";
import LogoutButton from "../top-nav/LogoutButton";
import { WALLET_ACCOUNTS_MODAL_ID } from "../top-nav/ConnectWallet";
import { Modal, initModals } from 'flowbite';
import type { ModalInterface } from 'flowbite';
import { useSaturnContext } from "../../providers/saturnProvider";
import { useWalletConnectContext } from "../../providers/walletConnectProvider";
import { walletAggregator } from "../../App";
import { Account, WalletType, BaseWallet } from "@polkadot-onboard/core";
import { WalletNameEnum, WcAccount, toWalletAccount } from "../../utils/consts";
import { pages } from "../../pages/pages";
import { MULTISIG_LIST_MODAL_ID } from "../left-side/MultisigList";

const CryptoAccounts = () => {
  let modal: ModalInterface;
  let multisigModal: ModalInterface;
  const $modalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);
  const $multisigModalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);
  const [availableWallets, setAvailableWallets] = createSignal<BaseWallet[]>(
    [],
  );
  const [availableAccounts, setAvailableAccounts] = createSignal<(Account & { title?: string; })[]>([]);
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [hasMultisigs, setHasMultisigs] = createSignal(false);

  const saContext = useSelectedAccountContext();
  const saturnContext = useSaturnContext();
  const wcContext = useWalletConnectContext();
  const theme = useThemeContext();

  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');

  const isActiveAccount = (account: Account) => {
    const selectedAccount = saContext.state.account;
    return selectedAccount ? account.address === selectedAccount.address && account : false;
  };

  const connectUserAccount = async (acc: Account) => {
    try {
      // First, logout of current multisig
      saturnContext.setters.logout();

      if (!acc) {
        throw new Error('Account is not defined');
      }

      const wallets = availableWallets();

      if (!wallets) {
        throw new Error('No available wallets');
      }

      const selectedWallet = wallets.find((w) => w.metadata.title === (acc as any).title);

      if (!selectedWallet) {
        throw new Error('No matching wallet found for account');
      }

      await saContext.setters.setSelected(acc, selectedWallet);

      if (!saturnContext || !saturnContext.setters || typeof saturnContext.setters.logout !== 'function') {
        throw new Error('Saturn context is not properly defined');
      }
    } catch (error) {
      console.error('Error in connectUserAccount:', error);
    } finally {
      removeModal();
    }
  };

  const connectWalletConnect = async () => {
    // Logout of any existing WalletConnect session
    try {
      const wcWallet = availableWallets().find((w) => w.type === WalletType.WALLET_CONNECT);
      if (!wcWallet) {
        throw new Error("WalletConnect wallet not found");
      }
      console.log('connecting to WalletConnect: ', wcWallet);

      if (!!wcWallet) {
        await wcWallet.connect();

        const accounts = await wcWallet.getAccounts();
        const selectedAccount = accounts?.[0];
        const selectedWcId = selectedAccount?.address;
        if (!selectedWcId) {
          throw new Error("No WalletConnect account selected");
        }

        // Finesse selectedAccount to have BaseWallet properties
        (selectedAccount as any).title = WalletNameEnum.WALLETCONNECT;
        (selectedAccount as any).type = "sr25519";
        (selectedAccount as any).name = wcWallet?.metadata.title;

        // Store WalletConnect session in saturn context
        await saContext.setters.setSelected(selectedAccount, wcWallet);

        // Also add WalletConnect account to availableAccounts
        setAvailableAccounts([...availableAccounts(), selectedAccount]);
        console.log('added WalletConnect to availableAccounts: ', availableAccounts());
      }
    } catch (error) {
      console.error('Error connecting to WalletConnect:', (error as any).message);
    } finally {
      removeModal();
    }
  };

  const handleLogout = () => {
    removeModal();
  };

  const handleOpenWalletConnect = () => {
    connectWalletConnect();
  };

  const removeModal = () => {
    if (modal) {
      modal.hide();
    }
  };

  onMount(() => {
    initModals();
    const instance = $modalElement();
    modal = new Modal(instance);

    const multisigInstance = $multisigModalElement();
    multisigModal = new Modal(multisigInstance);
  });

  createEffect(() => {
    const hasAddress = !!saContext.state.account?.address;
    setIsLoggedIn(hasAddress);
  });

  createEffect(() => {
    const multisigItems = saturnContext.state.multisigItems;
    setHasMultisigs(!!(multisigItems && multisigItems.length > 0));
  });

  createEffect(async () => {
    const allWallets = await walletAggregator.getWallets();
    setAvailableWallets(allWallets as BaseWallet[]);
  });

  createEffect(() => {
    const getAllAccounts = async () => {
      const wallets = availableWallets();
      let newAccounts = [];

      for (const wallet of wallets) {
        if (!wallet || typeof wallet.getAccounts !== 'function') {
          console.error('wallet is not valid or getAccounts is not a function');
          continue;
        }

        if (wallet.type !== WalletType.WALLET_CONNECT) {
          try {
            await wallet.connect();
          } catch (error) {
            console.error('connect error: ', error);
            continue;
          }
        }

        try {
          let availAccounts: Account[] & { title?: string; } = await wallet.getAccounts();
          availAccounts = availAccounts.map((account) => ({ title: wallet.metadata.title, name: wallet.metadata.title, ...account }));
          availAccounts = availAccounts.filter((account, index, self) => self.findIndex((a) => a.address === account.address) === index);
          newAccounts.push(...availAccounts);
        } catch (error) {
          console.error('getAccounts error: ', error);
          continue;
        }
      }

      setAvailableAccounts(newAccounts);
    };

    getAllAccounts();
  });

  createEffect(on(() => wcContext.state.w3w, () => {
    // Update the UI if the WalletConnect client is disconnected from its mobile peer

    // Get the selected storage
    const getSelectedStorage = () => saContext.setters.getSelectedStorage();

    // Get the client from the context
    const client = wcContext.state.w3w;

    // If there's no client or storage, exit the effect
    if (!client || !getSelectedStorage()) return;

    let lastKnownAddress: string = '';

    // Get the selected address from the storage
    const selectedAddress = getSelectedStorage().address;

    // Get the active sessions from the client
    const sessions = client.getActiveSessions();

    // Find the last known session that matches the selected address
    const lastKnownSession = Object.entries(sessions).find((s) => {
      lastKnownAddress = toWalletAccount(s[1].namespaces?.polkadot?.accounts?.[0] as WcAccount).address;
      return lastKnownAddress === selectedAddress;
    });

    // If there's no last known session or address, exit the effect
    if (!lastKnownSession || !lastKnownAddress) return;

    const lastSessionTopic = lastKnownSession[0];

    // Listen for the 'session_delete' event on the client
    client.events.on('session_delete', (session: { id: string; topic: string; }) => {
      // If the session topic matches the last session topic
      if (session.topic === lastSessionTopic) {
        console.log('session_deleted: ', session);

        // Remove the disconnected account from availableAccounts
        const updatedAccounts = availableAccounts().filter((a) => a.address !== lastKnownAddress);
        setAvailableAccounts(updatedAccounts);
      }
    });
  }));

  createEffect(on([hasMultisigs, isLoggedIn], () => {
    if (!hasMultisigs() && !isLoggedIn && multisigModal && multisigModal?.show) {
      multisigModal.show();
    }
  }));

  return (
    <>
      <div id={WALLET_ACCOUNTS_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-auto md:w-[500px] mx-auto md:p-4 overflow-x-hidden md:my-10 overflow-y-scroll z-[60]">
        <div id="accountsModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1" />
        <div class={`relative h-auto px-4 bg-saturn-offwhite dark:bg-black border border-gray-900  rounded-md w-full m-5 md:m-auto`}>
          <div class="flex flex-row items-start justify-between p-4">
            <h4 class="text-md font-semibold text-gray-900 dark:text-white">
              Connect Wallet
            </h4>
            <button type="button" class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={removeModal}>
              <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>
          <div class={`mx-4 ${ availableAccounts().length > 0 ? 'h-[500px]' : 'h-auto' }`}>
            <div class={`saturn-scrollbar h-full pr-5 overflow-y-scroll pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
              <Show when={availableAccounts().length > 0}>
                <For each={availableAccounts()}>
                  {account => {
                    return (
                      <div class={`${ !isActiveAccount(account) ? '' : 'dark:border-saturn-green' } dark:bg-gray-800 bg-gray-200 rounded-lg p-4 mb-2 border-[1.5px] border-gray-200 dark:border-gray-800 hover:border-saturn-purple dark:hover:border-saturn-purple hover:cursor-pointer`} onClick={[connectUserAccount, account]}>
                        <AvatarAndName name={account.name} avatar={(account as any).avatar} enlarge={true} />
                        <div class="flex flex-row justify-between items-start my-3">
                          <WalletLabel walletType={(account as any).title} />
                          <div class="xxs:text-xxs sm:text-xs"><NetworkBalance address={account.address} /></div>
                        </div>
                        <CopyAddressField address={account.address} length={18} isInModal={true} />
                      </div>
                    );
                  }}
                </For>
              </Show>
            </div>
          </div>
          <div class="flex flex-row justify-end gap-2 items-center m-6">
            <LogoutButton onClick={handleLogout} />
            {/* <WalletConnectButton onClick={handleOpenWalletConnect} /> */}
          </div>
        </div>
      </div>
    </>
  );
};

CryptoAccounts.displayName = 'CryptoAccounts';
export default CryptoAccounts;