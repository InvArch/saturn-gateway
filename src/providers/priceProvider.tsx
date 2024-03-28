import { createContext, JSX, useContext, createMemo, createEffect } from "solid-js";
import { createLocalStorage } from "@solid-primitives/storage";
import { NetworkEnum } from "../utils/consts";
import { getAllUsdPrices } from "../utils/getCurrentUsdPrice";
import { createStore } from "solid-js/store";

const PriceContext = createContext<{
  prices: Record<NetworkEnum, { usd: string; }> | null;
  fetchPrices: () => Promise<void>;
  clearPrices: () => void;
}>();

const initialPrices: Record<NetworkEnum, { usd: string; }> = {
  tinkernet: { usd: "" },
  basilisk: { usd: "" },
  picasso: { usd: "" },
  kusama: { usd: "" },
  polkadot: { usd: "" },
  assethub: { usd: "" },
};

export function PriceProvider(props: { children: JSX.Element; }) {
  const [prices, setPrices] = createStore<Record<NetworkEnum, { usd: string; }>>({ ...initialPrices });
  const [storageState, setStorageState, { remove }] = createLocalStorage<Record<NetworkEnum, { usd: string; }>>();

  const fetchPrices = async () => {
    let data = await getAllUsdPrices();
    if (!data && storageState['prices']) {
      data = JSON.parse(storageState['prices']);
    } else if (data) {
      setStorageState('prices', JSON.stringify(data));
    }
    setPrices(data ? data : initialPrices);
  };

  const clearPrices = () => {
    remove('prices');
    setPrices(initialPrices);
  };

  createEffect(() => {
    fetchPrices();
  });

  const value = createMemo(() => ({ prices, fetchPrices, clearPrices }));

  return (
    <PriceContext.Provider value={value()}>
      {props.children}
    </PriceContext.Provider>
  );
}

export function usePriceContext() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error("usePrice must be used within a PriceProvider");
  }
  return context;
}