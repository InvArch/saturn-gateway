import { createContext, useContext, JSX, onCleanup, createEffect, createSignal, onMount, createMemo } from 'solid-js';
import type { ModalInterface } from 'flowbite';
import { Modal, initModals } from 'flowbite';
import { MULTISIG_LIST_MODAL_ID } from '../components/left-side/MultisigList';
import { FEE_ASSET_MODAL_ID } from '../components/modals/FeeAssetModal';
import { PROPOSE_MODAL_ID } from '../components/modals/ProposeModal';
import { ADD_MEMBER_MODAL_ID, MULTISIG_MODAL_ID } from '../components/left-side/AddMultisigButton';
import { ADDRESS_SELECTOR_MODAL_ID } from '../components/modals/AddressSelectorModal';

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
};

const MegaModalContext = createContext<MegaModalContextType>();

export function MegaModalProvider(props: { children: JSX.Element; }) {
  const [multisigListModalInstance, setMultisigListModalInstance] = createSignal<ModalInterface>();
  const [feeAssetModalInstance, setFeeAssetModalInstance] = createSignal<ModalInterface>();
  const [proposedModalInstance, setProposedModalInstance] = createSignal<ModalInterface>();
  const [addMemberModalInstance, setAddMemberModalInstance] = createSignal<ModalInterface>();
  const [createMultisigModalInstance, setCreateMultisigModalInstance] = createSignal<ModalInterface>();
  const [addressSelectorModalInstance, setAddressSelectorModalInstance] = createSignal<ModalInterface>();

  const multisigListModalElement = () => document.getElementById(MULTISIG_LIST_MODAL_ID);
  const feeAssetModalElement = () => document.getElementById(FEE_ASSET_MODAL_ID);
  const proposedModalElement = () => document.getElementById(PROPOSE_MODAL_ID);
  const addMemberModalElement = () => document.getElementById(ADD_MEMBER_MODAL_ID);
  const createMultisigModalElement = () => document.getElementById(MULTISIG_MODAL_ID);
  const addressSelectorModalElement = () => document.getElementById(ADDRESS_SELECTOR_MODAL_ID);

  createEffect(() => {
    initModals();
  });

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

  const showMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const hideMultisigListModal = () => {
    const instance = multisigListModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const showFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const hideFeeAssetModal = () => {
    const instance = feeAssetModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const showProposeModal = () => {
    const instance = proposedModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const hideProposeModal = () => {
    const instance = proposedModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const showAddMemberModal = () => {
    const instance = addMemberModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const hideAddMemberModal = () => {
    const instance = addMemberModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const showCreateMultisigModal = () => {
    const instance = createMultisigModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const hideCreateMultisigModal = () => {
    const instance = createMultisigModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const showAddressSelectorModal = () => {
    const instance = addressSelectorModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const hideAddressSelectorModal = () => {
    const instance = addressSelectorModalInstance();
    if (instance) {
      instance.toggle();
    }
  };

  const store = createMemo(() => ({
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
  }));

  return (
    <MegaModalContext.Provider value={store()}>
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