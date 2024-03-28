import { createEffect, createMemo, createSignal } from "solid-js";
import SaturnCard from "../legos/SaturnCard";
import { CallDetailsWithHash } from "@invarch/saturn-sdk";
import { useSaturnContext } from "../../providers/saturnProvider";
import ActivityRow from "./ActivityRow";

const TransactionsContext = () => {
  const [pendingProposals, setPendingProposals] = createSignal<CallDetailsWithHash[]>([]);
  const saturnContext = useSaturnContext();

  const activity = createMemo(() => {
    for (let proposal of pendingProposals()) {
      for (let [voter, vote] of Object.entries(proposal.details.tally.records)) {
        return [voter, vote];
      }
      return proposal;
    }
  });

  createEffect(() => {
    const saturn = saturnContext.state.saturn;
    const multisigId = saturnContext.state.multisigId;

    const runAsync = async () => {
      if (!saturn || typeof multisigId !== 'number') {
        return;
      }
      console.log('multisigId', multisigId);
      const pendingCalls = await saturn.getPendingCalls(multisigId);
      console.log('pendingCalls', pendingCalls);
      setPendingProposals(pendingCalls);
    };

    runAsync();
  });

  createEffect(() => {
    console.log('activity', activity());
  });

  return <SaturnCard header="Multisig Activity">
    <div class="mt-1">
      <ActivityRow activity="router.sell" timestamp="1 day ago" aye={true} />
      <ActivityRow activity="router.sell" timestamp="1 week ago" aye={false} />
      <ActivityRow activity="ocifStaking.stake" timestamp="2 weeks ago" aye={false} />
    </div>
  </SaturnCard>;
};

TransactionsContext.displayName = 'TransactionsContext';
export default TransactionsContext;