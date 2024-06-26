import { createContext, useContext, JSX, onCleanup, createEffect, createSignal, onMount, createMemo } from 'solid-js';
import type { ModalInterface } from 'flowbite';
import { Modal, initModals } from 'flowbite';
import { MULTISIG_LIST_MODAL_ID } from '../components/left-side/MultisigList';
import { FEE_ASSET_MODAL_ID } from '../components/modals/FeeAssetModal';
import { PROPOSE_MODAL_ID } from '../components/modals/ProposeModal';
import { ADD_MEMBER_MODAL_ID, MULTISIG_MODAL_ID } from '../components/left-side/AddMultisigButton';
import { ADDRESS_SELECTOR_MODAL_ID } from '../components/modals/AddressSelectorModal';
import { WALLET_ACCOUNTS_MODAL_ID } from '../components/top-nav/ConnectWallet';

export type MegaModalContextType = {
  showMultisigListModal: () => void;
  hideMultisigListModal: () => void;
  showFeeAssetModal: () => void;
  hideFeeAssetModal: () => void;
  showProposeModal: () => void;
  hideProposeModal: () => void;
  showAddMemberModal: () => void;
  hideAddMemberModal: () => void;
  showCreateMultisigModal: () => void;
  hideCreateMultisigModal: () => void;
  showAddressSelectorModal: () => void;
  hideAddressSelectorModal: () => void;
  showCryptoAccountsModal: () => void;
  hideCryptoAccountsModal: () => void;
};

const MegaModalContext = createContext<MegaModalContextType>();

export function MegaModalProvider(props: { children: JSX.Element; }) {
  const [multisigListModalInstance, setMultisigListModalInstance] = createSignal<ModalInterface>();
  const [feeAssetModalInstance, setFeeAssetModalInstance] = createSignal<ModalInterface>();
  const [proposedModalInstance, setProposedModalInstance] = createSignal<ModalInterface>();
  const [addMemberModalInstance, setAddMemberModalInstance] = createSignal<ModalInterface>();
  const [createMultisigModalInstance, setCreateMultisigModalInstance] = createSignal<ModalInterface>();
  const [addressSelectorModalInstance, setAddressSelectorModalInstance] = createSignal<ModalInterface>();
  const [cryptoAccountsModalInstance, setCryptoAccountsModalInstance] = createSignal<ModalInterface>();

  const multisigListModalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);
  const feeAssetModalElement = () => document.getElementById(FEE_ASSET_MODAL_ID);
  const proposedModalElement = () => document.getElementById(PROPOSE_MODAL_ID);
  const addMemberModalElement = () => document.getElementById(ADD_MEMBER_MODAL_ID);
  const createMultisigModalElement = () => document.getElementById(MULTISIG_MODAL_ID);
  const addressSelectorModalElement = () => document.getElementById(ADDRESS_SELECTOR_MODAL_ID);
  const cryptoAccountsModalElement = () => document.getElementById(WALLET_ACCOUNTS_MODAL_ID);

  createEffect(() => {
    const modal = multisigListModalElement();
    if (multisigListModalElement()) {
      const instance = new Modal(modal);
      setMultisigListModalInstance(instance);
    }
  });

  createEffect(() => {
    const modal = feeAssetModalElement();
    if (feeAssetModalElement()) {
      const instance = new Modal(modal);
      setFeeAssetModalInstance(instance);
    }
  });

  createEffect(() => {
    const modal = proposedModalElement();
    if (proposedModalElement()) {
      const instance = new Modal(modal);
      setProposedModalInstance(instance);
    }
  });

  createEffect(() => {
    const modal = addMemberModalElement();
    if (addMemberModalElement()) {
      const instance = new Modal(modal);
      setAddMemberModalInstance(instance);
    }
  });

  createEffect(() => {
    const modal = createMultisigModalElement();
    if (createMultisigModalElement()) {
      const instance = new Modal(modal);
      setCreateMultisigModalInstance(instance);
    }
  });

  createEffect(() => {
    const modal = addressSelectorModalElement();
    if (addressSelectorModalElement()) {
      const instance = new Modal(modal);
      setAddressSelectorModalInstance(instance);
    }
  });

  createEffect(() => {
    const modal = cryptoAccountsModalElement();
    if (cryptoAccountsModalElement()) {
      const instance = new Modal(modal);
      setCryptoAccountsModalInstance(instance);
    }
  });

  const showMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const showFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const showProposeModal = () => {
    const instance = proposedModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideProposeModal = () => {
    const instance = proposedModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const showAddMemberModal = () => {
    const instance = addMemberModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideAddMemberModal = () => {
    const instance = addMemberModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const showCreateMultisigModal = () => {
    const instance = createMultisigModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideCreateMultisigModal = () => {
    const instance = createMultisigModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const showAddressSelectorModal = () => {
    const instance = addressSelectorModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideAddressSelectorModal = () => {
    const instance = addressSelectorModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const showCryptoAccountsModal = () => {
    const instance = cryptoAccountsModalInstance();
    if (instance) {
      instance.init();
      instance.show();
    }
  };

  const hideCryptoAccountsModal = () => {
    const instance = cryptoAccountsModalInstance();
    if (instance) {
      instance.hide();
      instance.destroy();
    }
  };

  const value = {
    showMultisigListModal,
    hideMultisigListModal,
    showFeeAssetModal,
    hideFeeAssetModal,
    showProposeModal,
    hideProposeModal,
    showAddMemberModal,
    hideAddMemberModal,
    showCreateMultisigModal,
    hideCreateMultisigModal,
    showAddressSelectorModal,
    hideAddressSelectorModal,
    showCryptoAccountsModal,
    hideCryptoAccountsModal,
  };

  return (
    <MegaModalContext.Provider value={value}>
      {props.children}
    </MegaModalContext.Provider>
  );
}

export function useMegaModal() {
  const context = useContext(MegaModalContext);

  if (!context) {
    throw new Error("useMultisigListModal: cannot find a MultisigListModalContext");
  }

  return context;
}