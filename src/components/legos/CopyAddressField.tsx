import { stringShorten } from "@polkadot/util";
import CopyIcon from '../../assets/icons/copy-icon-8x9-62.svg';
import { createEffect, createMemo, createSignal, on } from "solid-js";

type CopyAddressFieldProps = { address: string | undefined; length: number; name?: string; isInModal?: boolean; };

const CopyAddressField = (props: CopyAddressFieldProps) => {
  const [copied, setCopied] = createSignal<boolean>(false);
  const hasName = createMemo(() => props.name !== undefined);

  function copyToClipboard(e: MouseEvent) {
    // Prevent the click event from bubbling up to the parent element
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Copy the address to the clipboard
    navigator.clipboard.writeText(props.address ?? '--');

    // Set the copiedIndex state to the index of the copied item
    setCopied(true);

    // Revert the isCopied state back to false after 5 seconds
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }

  return <>
    <div class="rounded-md bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey p-2 flex flex-row items-center justify-center text-xs">
      <span class="mx-2 truncate ellipsis">{hasName() ? props.name : stringShorten(props.address ?? '--', props.isInModal ? 16 : 5)}</span>
      <span class={`ml-2 text-saturn-purple hover:opacity-50 hover:cursor-copy`} onClick={(e) => copyToClipboard(e)}>
        {copied() ? <span class="text-[8px]">Copied!</span> : <span><img src={CopyIcon} alt="copy-address" width={8} height={9.62} />
        </span>}
      </span>
    </div>
  </>;
};

CopyAddressField.displayName = 'CopyAddressField';
export default CopyAddressField;