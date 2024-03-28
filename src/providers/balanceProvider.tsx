import { createContext, useContext, JSX, createMemo, createEffect, createSignal } from 'solid-js';
import { getBalancesFromAllNetworks } from '../utils/getBalances';
import { useSaturnContext } from "./saturnProvider";
import { createStore } from 'solid-js/store';
import { NetworkAssetBalance } from '../pages/Assets';

export interface BalanceContextType {
  balances: NetworkAssetBalance[];
  loading: boolean;
  clearBalances: () => void;
  fetchBalances: (refetch?: boolean) => void;
}

const BalanceContext = createContext<BalanceContextType>();

export function BalanceProvider(props: { children: JSX.Element; }) {
  const [balances, setBalances] = createStore<NetworkAssetBalance[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);

  const saturnContext = useSaturnContext();

  const clearBalances = () => {
    setBalances([]);
  };

  const fetchBalances = async (refetch?: boolean) => {
    const id = saturnContext.state.multisigId;
    const address = saturnContext.state.multisigAddress;

    if (typeof id !== 'number' || !address) {
      console.log('Invalid multisig id or address', id, address);
      return;
    }

    setLoading(true);
    try {
      const nb = await getBalancesFromAllNetworks(address);
      const remapped = Object.entries(nb).map(([network, assets]) => {
        return [network, Object.entries(assets).map(([asset, assetBalances]) => {
          return [asset, assetBalances];
        })];
      });

      setBalances(remapped as unknown as NetworkAssetBalance[]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching balances', error);
      setLoading(false);
    }
  };

  createEffect(() => {
    fetchBalances();
  });

  const value = createMemo(() => ({ balances, loading: loading(), clearBalances, fetchBalances }));

  return (
    <BalanceContext.Provider value={value()}>
      {props.children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext() {
  return useContext(BalanceContext);
}