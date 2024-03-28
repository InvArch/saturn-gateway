import BasiliskIcon from '../assets/icons/basilisk-icon.svg';
import TinkernetIcon from '../assets/icons/tinkernet-icon.svg';
import PicassoIcon from '../assets/icons/picasso-icon.svg';
import KusamaIcon from '../assets/icons/kusama-icon.svg';
import KusamaAssetHubIcon from '../assets/icons/assethub-icon.svg';
import PolkadotIcon from '../assets/icons/polkadot-icon-25x25.png';
import { JSXElement } from 'solid-js';

export const BUTTON_COMMON_STYLE = 'rounded-lg border-[1.5px] border-saturn-purple bg-gray-200 dark:bg-saturn-darkgrey active:border-saturn-purple visited:border-saturn-purple flex flex-row items-center focus:outline-none';

export const INPUT_COMMON_STYLE = "rounded-md border-0 outline-0 focus:ring-0 bg-saturn-offwhite dark:bg-gray-900 text-saturn-darkgrey dark:text-saturn-lightgrey px-2 py-1 flex flex-row items-center justify-center text-xxs focus:bg-purple-100 focus:bg-opacity-50 dark:focus:bg-saturn-darkpurple";

export const INPUT_CREATE_MULTISIG_STYLE = "rounded-md border-0 outline-0 focus:ring-2 focus:ring-purple-500 bg-white dark:bg-white dark:bg-opacity-50 bg-opacity-50 text-black dark:text-black focus:text-black dark:focus:text-black px-2 py-[10px] flex flex-row items-center justify-center text-sm hover:bg-opacity-75 dark:hover:bg-opacity-75 focus:bg-opacity-100 dark:focus:bg-opacity-100";

export const MINI_TEXT_LINK_STYLE = "text-saturn-purple text-xxs font-bold hover:cursor-pointer hover:text-purple-500 inline-flex shrink";

export const TEXT_LINK_STYLE = "text-saturn-purple text-sm font-bold hover:cursor-pointer hover:text-purple-500 inline-flex shrink";

export const FALLBACK_TEXT_STYLE = "text-saturn-black dark:text-saturn-offwhite text-xs";

export const CRUMB_STYLE = "text-xxs font-medium py-3 rounded-md focus:outline-none text-center w-[150px] crumb-btn disabled:cursor-not-allowed";

export enum WalletNameEnum {
  SUBWALLET = "subwallet-js", // ?
  TALISMAN = "talisman",
  NOVAWALLET = "nova wallet",
  PJS = "polkadot-js", // ?
  CRUSTWALLET = "crust wallet",
  SPORRAN = "sporran",
  WALLETCONNECT = "wallet-connect"
}

export enum NetworkEnum {
  TINKERNET = "tinkernet",
  BASILISK = "basilisk",
  PICASSO = "picasso",
  KUSAMA = "kusama",
  POLKADOT = "polkadot",
  ASSETHUB = "assethub",
}

// export const WSS_TINKERNET = 'wss://brainstorm.invarch.network/rococo';
// export const WSS_TINKERNET = 'wss://invarch-tinkernet.api.onfinality.io/public-ws';
// export const WSS_TINKERNET = 'wss://brainstorm.invarch.network/invarch-bootstrap';
// export const WSS_TINKERNET = 'ws://localhost:8000';
export const WSS_TINKERNET = 'wss://tinkernet-rpc.dwellir.com';
// export const WSS_TINKERNET = 'ws://localhost:9944';

export const WC_PROJECT_ID = '04b924c5906edbafa51c651573628e23';

export const AssetIconByCurrency: Record<string, string> = {
  TNKR: TinkernetIcon,
  BSX: BasiliskIcon,
  PICA: PicassoIcon,
  KSM: KusamaIcon,
  DOT: PolkadotIcon,
};

export const NetworkIconByCurrency: Record<string, string[]> = {
  TNKR: [TinkernetIcon, BasiliskIcon],
  BSX: [BasiliskIcon],
  PICA: [PicassoIcon],
  KSM: [KusamaIcon, TinkernetIcon, BasiliskIcon, PicassoIcon, KusamaAssetHubIcon],
  DOT: [PolkadotIcon],
};

export enum KusamaFeeAssetEnum {
  TNKR = "TNKR",
  KSM = "KSM",
}

export enum MultisigEnum {
  TRADITIONAL = "Traditional",
  GOVERNANCE = "Governance",
}

export type MultisigItem = {
  id: number;
  copyIcon: JSXElement;
  address: string,
  capitalizedFirstName: string;
  image?: string;
  activeTransactions: number;
};

export type WcAccount = `${ string }:${ string }:${ string }`;

export const toWalletAccount = (wcAccount: WcAccount) => {
  let address = wcAccount.split(':')[2];
  return { address };
};

export type ApiTypes = 'promise' | 'rxjs';