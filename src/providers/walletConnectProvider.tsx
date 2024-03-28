import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { MultisigCall } from "@invarch/saturn-sdk";
import type Web3WalletType from '@walletconnect/web3wallet';
import { Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet';

interface IWalletConnectState { w3w?: Web3WalletType; saturnQr?: string; sessionProposalCallback?: (proposal: Web3WalletTypes.SessionProposal) => Promise<void>; sessionRequestCallback?: (event: Web3WalletTypes.SessionRequest) => Promise<void>; }

export const WalletConnectContext = createContext<{ state: IWalletConnectState, setters: any; }>({ state: {}, setters: {} });

export type WalletConnectProviderProps = {
  children: any;
};

const defaultState = (): IWalletConnectState => {
  return {
    w3w: undefined,
    saturnQr: undefined,
  };
};

export function WalletConnectProvider(props: WalletConnectProviderProps) {
  const [state, setState] = createStore<IWalletConnectState>(defaultState());

  const value = {
    state,
    setters: {
      setWalletConnect(walletConnect: Web3WalletType, sessionProposalCallback: (proposal: Web3WalletTypes.SessionProposal) => Promise<void>, sessionRequestCallback: (event: Web3WalletTypes.SessionRequest) => Promise<void>) {
        const w3w = walletConnect;
        w3w.events.on('session_proposal', sessionProposalCallback);
        w3w.events.on('session_request', sessionRequestCallback);
        setState({ w3w, sessionProposalCallback, sessionRequestCallback });
      },

      setSaturnQr(qrCode: string) {
        setState({ saturnQr: qrCode });
      },
    }
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {props.children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnectContext() {
  const context = useContext(WalletConnectContext);

  if (!context) {
    throw new Error("useWalletConnectContext: cannot find a WalletConnectContext");
  }

  return context;
}
