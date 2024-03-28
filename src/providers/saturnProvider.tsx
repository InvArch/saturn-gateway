import { createContext, createMemo, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { type Saturn, type MultisigDetails } from "@invarch/saturn-sdk";
import { MultisigItem } from "../utils/consts";

interface SaturnContextState {
  saturn?: Saturn;
  multisigId?: number | undefined;
  multisigAddress?: string;
  multisigDetails?: MultisigDetails,
  multisigItems?: MultisigItem[];
};

export type SaturnContextType = {
  state: SaturnContextState,
  setters: {
    setSaturn: (saturn: Saturn) => void;
    setMultisigId: (multisigId: number | undefined) => void;
    setMultisigAddress: (multisigAddress: string) => void;
    setMultisigDetails: (multisigDetails: MultisigDetails) => void;
    setMultisigItems: (multisigItems: MultisigItem[]) => void;
    logout: () => void;
  },
};

const defaultState: SaturnContextState = {
  saturn: undefined,
  multisigId: undefined,
  multisigAddress: undefined,
  multisigDetails: undefined,
  multisigItems: [],
};

const defaultSetters = {
  setSaturn: () => { },
  setMultisigId: () => { },
  setMultisigAddress: () => { },
  setMultisigDetails: () => { },
  setMultisigItems: () => { },
  logout: () => { },
};

export const SaturnContext = createContext<SaturnContextType>({
  state: defaultState, setters: defaultSetters
});

export function SaturnProvider(props: any) {
  const [state, setState] = createStore<SaturnContextState>(defaultState);

  const value = createMemo(() => ({
    state,
    setters: {
      setSaturn(saturn: Saturn) {
        setState("saturn", saturn);
      },

      setMultisigId(multisigId: number | undefined) {
        setState("multisigId", multisigId);
      },

      setMultisigAddress(multisigAddress: string) {
        setState("multisigAddress", multisigAddress);
      },

      setMultisigDetails(multisigDetails: MultisigDetails) {
        setState("multisigDetails", multisigDetails);
      },

      setMultisigItems(multisigItems: MultisigItem[]) {
        setState("multisigItems", multisigItems);
      },

      logout() {
        setState("multisigId", undefined);
        setState("multisigAddress", undefined);
        setState("multisigDetails", undefined);
        setState("multisigItems", []);
      }
    }
  }));

  return (
    <SaturnContext.Provider value={value()}>
      {props.children}
    </SaturnContext.Provider>
  );
}

export function useSaturnContext() {
  const context = useContext(SaturnContext);

  if (!context) {
    throw new Error("useProposeContext: cannot find a ProposeContext");
  }

  return context;
}
