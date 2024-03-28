import { ApiPromise } from "@polkadot/api";
import { AccountId } from "@polkadot/types/interfaces";
import { BN } from "@polkadot/util";

export const getMultisigsForAccount = async (
  account: string,
  api: ApiPromise
): Promise<number[]> => {
  const entries = await api.query.coreAssets.accounts.keys(account);
  const mapped = entries.map((entry) => entry.args[1].toNumber());

  return mapped;
};
