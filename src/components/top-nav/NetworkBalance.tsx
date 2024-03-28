import { createEffect, createSignal } from "solid-js";
import { useRingApisContext } from "../../providers/ringApisProvider";
import BigNumber from "bignumber.js";
import WalletIcon from "../../assets/icons/wallet-icon.svg";
import { formatAsset } from "../../utils/formatAsset";

type BalancePrimitiveType = {
  nonce: string;
  consumers: string;
  providers: string;
  sufficients: string;
  data: {
    free: string;
    reserved: string;
    frozen: string;
  };
};

type AssetReturnType = { free: number, reserved: number, frozen: number; };

const NetworkBalance = (props: { address: string | undefined; }) => {
  const [tnkrBalance, setTnkrBalance] = createSignal<string | null>(null);
  const [ksmBalance, setKsmBalance] = createSignal<string | null>(null);
  const rings = useRingApisContext();

  const setBalanceTNKR = async () => {
    try {
      if (!rings.state.tinkernet || !props.address) return;

      await rings.state.tinkernet.query.system.account(props.address, (account) => {
        const balance = account.toPrimitive() as BalancePrimitiveType;
        const total = new BigNumber(balance.data.free.toString());
        const frozen = new BigNumber(balance.data.frozen.toString());
        const reserved = new BigNumber(balance.data.reserved.toString());
        const transferable = total.minus(frozen).minus(reserved);
        const formattedBalance = formatAsset(transferable.toString(), 12, 2);

        setTnkrBalance(formattedBalance);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const setBalanceKSM = async () => {
    try {
      if (!rings.state.tinkernet || !props.address) return;

      const accountInfo = await rings.state.tinkernet.query.tokens.accounts(props.address, 1);
      const { free: total, reserved, frozen } = accountInfo.toHuman() as unknown as AssetReturnType;

      // Convert to BigNumber safely, defaulting to 0 if NaN
      const formatTotal = new BigNumber(isNaN(total) ? 0 : total);
      const formatFrozen = new BigNumber(isNaN(frozen) ? 0 : frozen);
      const formatReserve = new BigNumber(isNaN(reserved) ? 0 : reserved);

      // Calculate transferable balance
      const transferable = formatTotal.minus(formatFrozen).minus(formatReserve);

      // Check if the result is NaN
      if (!transferable.isNaN()) {
        const formattedBalance = formatAsset(transferable.toString(), 10);
        setKsmBalance(formattedBalance);
      } else {
        // Handle NaN result, e.g., by setting balance to "0" or logging an error
        console.error("Calculated balance is NaN");
        setKsmBalance("0");
      }
    } catch (error) {
      console.error(error);
    }
  };

  createEffect(() => {
    setBalanceTNKR();
    setBalanceKSM();
  });

  return (
    <div class="flex items-start flex-row gap-2">
      <img src={WalletIcon} alt="purple-wallet-icon" class="mt-[2px]" />
      <div>
        <div class="flex justify-end flex-row gap-1 text-saturn-black dark:text-saturn-offwhite">
          <span>{tnkrBalance()}</span>
          <span>TNKR</span>
        </div>
        <div class="flex justify-end flex-row gap-1 text-saturn-black dark:text-saturn-offwhite">
          <span>{ksmBalance()}</span>
          <span>KSM</span>
        </div>
      </div>
    </div>
  );
};

NetworkBalance.displayName = "NetworkBalance";
export default NetworkBalance;