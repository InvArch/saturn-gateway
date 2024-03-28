import { createSignal, For, createEffect, Show, Switch, Match, onCleanup, createMemo, on, onMount } from 'solid-js';
import { getBalancesFromAllNetworks } from '../utils/getBalances';
import { AssetEnum, NetworksByAsset, Rings } from '../data/rings';
import { useSaturnContext } from "../providers/saturnProvider";
import type { BalanceType, NetworkBalances, ResultBalances } from "../utils/getBalances";
import { formatAsset } from '../utils/formatAsset';
import { getAssetIcon } from '../utils/getAssetIcon';
import { getNetworkIcon } from '../utils/getNetworkIcon';
import { FALLBACK_TEXT_STYLE, NetworkEnum } from '../utils/consts';
import BigNumber from 'bignumber.js';
import { createStore } from 'solid-js/store';
import LoaderAnimation from '../components/legos/LoaderAnimation';
import { useSelectedAccountContext } from '../providers/selectedAccountProvider';
import { usePriceContext } from '../providers/priceProvider';
import { useBalanceContext } from '../providers/balanceProvider';

const StakePage = {
  tinkernet_TNKR: 'https://tinker.network/staking',
};

export type NetworkAssetBalance = [string, BalanceType[]];

export type NetworkBalancesArray = [string, NetworkAssetBalance[]];

export default function Assets() {
  const [loading, setLoading] = createSignal<boolean>(true);
  const [balances, setBalances] = createSignal<NetworkAssetBalance[]>([]);
  const [usdValues, setUsdValues] = createStore<Record<string, string>>({});
  const [totalValues, setTotalValues] = createStore<Record<string, string>>({});
  const [usdPrices, setUsdPrices] = createStore<Record<string, string>>({});

  const balanceContext = useBalanceContext();
  const saturnContext = useSaturnContext();
  const saContext = useSelectedAccountContext();
  const priceContext = usePriceContext();

  const saturnState = createMemo(() => saturnContext.state);
  const accountState = createMemo(() => saContext.state);
  const getMultisigAddress = createMemo(() => saturnState().multisigAddress);
  const getMultisigId = createMemo(() => saturnState().multisigId);
  const getAccountAddress = createMemo(() => accountState().account?.address);
  const getUsdPrices = createMemo(() => priceContext.prices);

  const convertAssetTotalToUsd = async (asset: AssetEnum, network: NetworkEnum, total: string) => {
    let totalInUsd = '($0.00)';
    const allPrices = usdPrices;

    if (!allPrices) return totalInUsd;

    let currentMarketPrice = null;

    if (asset === AssetEnum.TNKR) {
      const tnkrPrice = allPrices[network];
      if (tnkrPrice && new BigNumber(tnkrPrice).isGreaterThan(0)) {
        currentMarketPrice = new BigNumber(tnkrPrice);
      } else {
        return totalInUsd;
      }
    } else {
      const specificNetworkPrice = allPrices[network];
      if (specificNetworkPrice && new BigNumber(specificNetworkPrice).isGreaterThan(0)) {
        currentMarketPrice = new BigNumber(specificNetworkPrice);
      } else {
        const networksHoldingAsset = NetworksByAsset[asset];
        for (const net of networksHoldingAsset) {
          const price = allPrices[net];
          if (price && new BigNumber(price).isGreaterThan(0)) {
            currentMarketPrice = new BigNumber(price);
            break;
          }
        }
      }
    }

    if (total && currentMarketPrice !== null) {
      const decimals = Rings[network]?.decimals ?? 12;
      totalInUsd = `($${ formatAsset(new BigNumber(total).times(currentMarketPrice).toString(), decimals) })`;
    } else {
      console.error(`Decimals not found for asset: ${ asset } or market price is $0`);
    }

    return totalInUsd;
  };

  createEffect(() => {
    const allPrices = getUsdPrices();

    const loadPrices = async () => {
      if (allPrices) {
        const pricesInUsd = Object.entries(allPrices).reduce((acc, [network, priceInfo]) => {
          acc[network] = priceInfo.usd;
          return acc;
        }, {} as Record<string, string>);
        setUsdPrices(pricesInUsd);
      } else {
        console.log('No prices found', allPrices);
      }
    };

    loadPrices();
  });

  createEffect(() => {
    const allBalances = balanceContext?.balances;
    const isLoading = balanceContext?.loading;

    const runAsync = async () => {
      setBalances(allBalances as unknown as NetworkAssetBalance[]);
      if (!isLoading) setLoading(false);
    };

    runAsync();
  });

  createEffect(() => {
    // Convert transferable balances to USD
    const loadTransferableBalances = async () => {
      for (const [network, assets] of balances()) {
        for (const [asset, b] of assets as unknown as NetworkBalancesArray) {
          const balances = b as unknown as BalanceType;
          const value = await convertAssetTotalToUsd(asset as AssetEnum, network as NetworkEnum, balances.freeBalance);
          setUsdValues(usdValues => ({ ...usdValues, [`${ network }-${ asset }`]: value }));
        }
      }
    };

    loadTransferableBalances();
  });

  createEffect(() => {
    // Convert total balances to USD
    const loadTotalBalances = async () => {
      for (const [network, assets] of balances()) {
        const assetsCopy = assets;
        for (const [asset, balanceDetails] of assetsCopy as unknown as NetworkBalancesArray) {
          const balance = balanceDetails[1] as BalanceType[];
          if (balance && Array.isArray(balance)) {
            for (const b of balance) {
              const value = await convertAssetTotalToUsd(asset as AssetEnum, network as NetworkEnum, b.freeBalance);
              setTotalValues(totalValues => ({ ...totalValues, [`${ network }-${ asset }`]: value }));
            }
          }

          return;
        }
      }
    };

    loadTotalBalances();
  });

  onCleanup(() => {
    setLoading(true);
  });

  return (
    <>
      <div class="relative saturn-scrollbar overflow-x-scroll overscroll-contain min-h-64 h-full flex flex-col content-stretch">
        <table class="w-full text-sm text-left text-saturn-lightgrey">
          <thead class="text-xs bg-saturn-offwhite dark:bg-saturn-black">
            <tr>
              <th scope="col" class='py-3 px-4 text-left w-[20%]'>Asset</th>
              <th scope="col" class='py-3 px-4 text-left w-[30%]'>Transferable</th>
              <th scope="col" class='py-3 px-4 text-left w-[30%]'>Total</th>
              <th scope="col" class='w-[20%]'>Chains</th>
            </tr>
          </thead>
          <Switch fallback={<div class="mt-4">
            {loading() ? <LoaderAnimation text="Loading assets..." /> : <span class={`${ FALLBACK_TEXT_STYLE } mt-5`}>No assets found.</span>}
          </div>}>
            <Match when={balances() && balances().length > 0}>
              <For each={balances()}>{([network, assets]) => {
                return <Show when={assets.length}>
                  <tbody class="dark:text-saturn-offwhite text-saturn-black">
                    <For each={assets as unknown as [string, BalanceType][]}>{([asset, b]) => {
                      const totalLockAmount = !!b.locks && b.locks.length > 0 ? b.locks.reduce((acc, lock) => acc + parseInt(lock.amount.toString()), 0).toString() : '0';
                      return <tr class="border-b border-gray-200 dark:border-gray-800">
                        {/* Asset */}
                        <td class='py-3 px-4 text-left w-[20%]'>
                          <span class="flex flex-row items-center gap-1">
                            <span class='h-5 w-5 flex rounded-full bg-black'>
                              <img src={getAssetIcon(asset)} class="p-1" alt={asset} />
                            </span>
                            <span>
                              {asset}
                            </span>
                          </span>
                        </td>

                        {/* Transferable */}
                        <td class='py-3 px-4 text-left w-[30%]'>
                          <span class="flex flex-row items-baseline gap-1">
                            <span>
                              {formatAsset(b.freeBalance, Rings[network as keyof typeof Rings]?.decimals ?? 12)}
                            </span>
                            <span class="text-[9px]">{asset}</span>
                            <span class="text-saturn-lightgrey text-[8px]">
                              {usdValues[`${ network }-${ asset }`]}
                            </span>
                          </span>
                        </td>

                        {/* Total */}
                        <td class='py-3 px-4 text-left w-[30%]'>
                          <span class="flex flex-row items-baseline gap-1">
                            <span>
                              {formatAsset((+b.freeBalance + +b.reservedBalance + +totalLockAmount).toString(), Rings[network as keyof typeof Rings]?.decimals ?? 12)}
                            </span>
                            <span class="text-[9px]">{asset}</span>
                            <span class="text-saturn-lightgrey text-[8px]">
                              {totalValues[`${ network }-${ asset }`]}
                            </span>
                          </span>
                        </td>

                        {/* Chains */}
                        <td>
                          <span class="flex flex-row items-center gap-1">
                            <For each={getNetworkIcon(asset).filter(icon => icon.toLowerCase().includes(network.toLowerCase()))}>
                              {icon =>
                                <span class='h-5 w-5 flex rounded-full bg-black'>
                                  <img src={icon} class="p-1" alt="asset-icon" />
                                </span>
                              }
                            </For>
                          </span>
                        </td>

                      </tr>;
                    }
                    }</For>
                  </tbody>
                </Show>;
              }
              }</For>
            </Match>
          </Switch>
        </table>
      </div>
    </>
  );
}
