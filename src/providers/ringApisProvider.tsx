import { createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { ApiPromise } from '@polkadot/api';

export interface IRingsContext {
  state: RingStoreType,
  setters: any,
}

export const RingApisContext = createContext<IRingsContext>({ state: {}, setters: {} });

type RingStoreType = { [ring: string]: ApiPromise; };

export function RingApisProvider(props: any) {
  const [state, setState] = createStore<RingStoreType>({});

  const value = {
    state,
    setters: {
      setRingApi(ring: string, api: ApiPromise) {
        setState(ring, api);
      },

      setRingApisBatch(ringApis: Record<string, ApiPromise>) {
        for (const [r, a] of Object.entries(ringApis)) {
          setState(r, a);
        }
      }
    }
  };

  return (
    <RingApisContext.Provider value={value}>
      {props.children}
    </RingApisContext.Provider>
  );
}

export function useRingApisContext() {
  const context = useContext(RingApisContext);

  if (!context) {
    throw new Error("useRingApisContext: cannot find a RingApisContext");
  }

  return context;
}
