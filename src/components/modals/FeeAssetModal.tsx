import { Dropdown, DropdownInterface, initDropdowns, DropdownOptions } from "flowbite";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount } from "solid-js";
import { useMegaModal } from "../../providers/megaModalProvider";
import { KusamaFeeAssetEnum } from "../../utils/consts";
import SaturnSelect from "../legos/SaturnSelect";
import SaturnSelectItem from "../legos/SaturnSelectItem";
import { FEE_TOGGLE_ID, FEE_DROPDOWN_ID } from "../top-nav/ConnectWallet";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";

export const FEE_ASSET_MODAL_ID = 'feeAssetModal';

const dropdownOptions: DropdownOptions = {
  placement: 'bottom',
  triggerType: 'click',
  offsetSkidding: 0,
  offsetDistance: 20,
  delay: 300,
};

const FeeAssetModal = () => {
  const feeToggleElement = () => document.getElementById(FEE_TOGGLE_ID);
  const feeDropdownElement = () => document.getElementById(FEE_DROPDOWN_ID);

  const [isFeeDropDownActive, setIsFeeDropDownActive] = createSignal(false);
  const [feeDropdown, setFeeDropdown] = createSignal<DropdownInterface | null>(null);
  const [feeAsset, setFeeAsset] = createSignal<KusamaFeeAssetEnum>(KusamaFeeAssetEnum.TNKR);

  const megaModal = useMegaModal();
  const selectedAccount = useSelectedAccountContext();

  const openFeeDropdown = () => {
    if (!isFeeDropDownActive()) {
      feeDropdown()?.show();
      setIsFeeDropDownActive(true);
    } else {
      feeDropdown()?.hide();
      setIsFeeDropDownActive(false);
    }
  };

  const handleFeeSelect = (fee: KusamaFeeAssetEnum) => {
    if (isFeeDropDownActive()) {
      setFeeAsset(fee);
      selectedAccount.setters.setFeeAsset(fee);
      setIsFeeDropDownActive(false);
      feeDropdown()?.hide();
      megaModal.hideFeeAssetModal();
    }
  };

  onMount(() => {
    initDropdowns();
  });

  onMount(() => {
    const instance = new Dropdown(feeDropdownElement(), feeToggleElement(), dropdownOptions);
    setFeeDropdown(instance);
  });

  createEffect(() => {
    const selectedAsset = selectedAccount.setters.getFeeAsset() as KusamaFeeAssetEnum;
    setFeeAsset(selectedAsset);
  });

  createEffect(() => {
    const handleFeeClickOutside = (event: any) => {
      if (event && feeToggleElement() && feeDropdownElement() && !feeToggleElement()?.contains(event.target) && !feeDropdownElement()?.contains(event.target) && feeDropdown()) {
        setIsFeeDropDownActive(false);
        feeDropdown()?.hide();
      }
    };

    if (isFeeDropDownActive()) {
      document.addEventListener('click', handleFeeClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleFeeClickOutside);
    });
  });

  return <div id={FEE_ASSET_MODAL_ID} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden w-auto md:w-[500px] mx-auto md:p-4 overflow-x-hidden md:my-10 overflow-y-scroll z-[60]">
    <div id="feeAssetModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1" />
    <div class={`relative h-52 px-4 bg-saturn-offwhite dark:bg-black border border-gray-900  rounded-md w-full m-5 md:m-auto`}>
      <div class="flex flex-row items-center justify-between gap-10 p-4">
        <h4 class="text-md font-semibold text-gray-900 dark:text-white">
          Select Fee Asset
        </h4>
        <button type="button" class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={megaModal.hideFeeAssetModal}>
          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
          </svg>
          <span class="sr-only">Close modal</span>
        </button>
      </div>
      <div class="flex flex-col">
        <div class="relative mx-3">
          <SaturnSelect isOpen={isFeeDropDownActive()} toggleId={FEE_TOGGLE_ID} dropdownId={FEE_DROPDOWN_ID} initialOption={feeAsset()} onClick={openFeeDropdown}>
            <For each={Object.values(KusamaFeeAssetEnum)}>
              {(asset) => {
                return <SaturnSelectItem onClick={[handleFeeSelect, asset as KusamaFeeAssetEnum]}>
                  {asset}
                </SaturnSelectItem>;
              }}
            </For>
          </SaturnSelect>
        </div>
      </div>
    </div>
  </div>;
};

FeeAssetModal.displayName = 'FeeAssetModal';
export default FeeAssetModal;