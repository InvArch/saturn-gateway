import { createSignal, For, createEffect, Switch, Match, onCleanup, createMemo, onMount, Show } from 'solid-js';
import { ParsedTallyRecords, type CallDetailsWithHash, type ParsedTallyRecordsVote } from '@invarch/saturn-sdk';
import { BN, stringShorten } from '@polkadot/util';
import type { AnyJson } from '@polkadot/types/types/codec';
import type { Call } from '@polkadot/types/interfaces';
import { useLocation } from '@solidjs/router';
import { useRingApisContext } from "../providers/ringApisProvider";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { Rings } from '../data/rings';
import FormattedCall from '../components/legos/FormattedCall';
import { getAllMembers } from '../utils/getAllMembers';
import { MembersType } from './Management';
import SaturnAccordionItem from '../components/legos/SaturnAccordionItem';
import { initAccordions, AccordionInterface, Accordion as FlowAccordion, AccordionItem as FlowAccordionItem } from 'flowbite';
import { FALLBACK_TEXT_STYLE } from '../utils/consts';
import { processCallData } from '../utils/processCallData';
import AyeIcon from '../assets/icons/aye-icon-17x17.svg';
import NayIcon from '../assets/icons/nay-icon-17x17.svg';
import SaturnProgress from '../components/legos/SaturnProgress';
import LoaderAnimation from '../components/legos/LoaderAnimation';
import { SubmittableResult } from '@polkadot/api';

export const ACCORDION_ID = 'accordion-collapse';

export type QueuePageProps = {
};

export default function Transactions() {
  let accordion: AccordionInterface;
  const [pendingProposals, setPendingProposals] = createSignal<CallDetailsWithHash[]>([]);
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);

  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();
  const multisigHashId = loc.pathname.split('/')[1];

  const getMultisigId = createMemo(() => saturnContext.state.multisigId);
  const hasVoted = createMemo(() => pendingProposals().some(pc => Object.keys(pc.details.tally.records).includes(selectedAccountContext.state.account?.address || '')));

  const totalVotes = (records: ParsedTallyRecords): number => {
    let total = 0;
    for (let record of Object.values(records)) {
      if (record.aye) {
        total += parseInt(record.aye.toString());
      }
      if (record.nay) {
        total += parseInt(record.nay.toString());
      }
    }

    return total / 1000000;
  };

  const totalAyeVotes = (records: ParsedTallyRecords): number => {
    let total = 0;

    for (let record of Object.values(records)) {
      if (record.aye) {
        total += parseInt(record.aye.toString());
      }
    }

    // Calculate the percentage of total votes
    const percentage = total / 1000000 / totalVotes(records) * 100;

    // Round the percentage to a whole number
    const roundedPercentage = Math.round(percentage);

    return roundedPercentage;
  };

  const totalNayVotes = (records: ParsedTallyRecords): number => {
    let total = 0;

    for (let record of Object.values(records)) {
      if (record.nay) {
        total += parseInt(record.nay.toString());
      }
    }

    // Calculate the percentage of total votes
    const percentage = total / 1000000 / totalVotes(records) * 100;

    // Round the percentage to a whole number
    const roundedPercentage = Math.round(percentage);

    return roundedPercentage;
  };

  const handleAccordionClick = (index: number) => {
    try {
      if (document.querySelector(`#content${ index }`)) {
        accordion.toggle(`#content${ (index) }`);
      } else {
        console.error('Accordion is not initialized');
      }
    } catch (e) {
      return null;
    }
  };

  const withdrawVote = async (pc: CallDetailsWithHash) => {
    const selectedAccountAddress = selectedAccountContext.state.account?.address;
    const saturn = saturnContext.state.saturn;
    const multisigId = saturnContext.state.multisigId;
    const callHash = pc.callHash.toString();

    if (!selectedAccountAddress) {
      console.error('No account selected');
      return;
    }

    const isVoter = Object.keys(pc.details.tally.records).includes(selectedAccountAddress);

    if (!isVoter) {
      console.error('Selected account is not a voter for this proposal');
      return;
    }

    if (!saturn || typeof multisigId !== 'number') {
      console.error('Invalid state for withdrawing vote');
      return;
    }

    try {
      const result = saturn.withdrawVote({
        id: multisigId,
        callHash,
      });
      console.log('Withdraw vote result:', result);
      await result.signAndSend(selectedAccountAddress, { signer: selectedAccountContext.state.wallet?.signer });
    } catch (error) {
      console.error('Error withdrawing vote:', error);
    }
  };

  const vote = async (callHash: string, aye: boolean) => {
    const selected = selectedAccountContext.state;

    if (!saturnContext.state.saturn || !selected.account || !selected.wallet?.signer || typeof saturnContext.state.multisigId !== 'number') {
      return;
    }

    const result = await saturnContext.state.saturn.vote({
      id: saturnContext.state.multisigId,
      callHash,
      aye,
    }).signAndSend(selected.account.address, { signer: selected.wallet.signer });

    console.log('result: ', result);
  };

  const processCallDescription = (call: Call): string => {
    switch (call.method) {
      case 'sendCall':
        const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
        const innerCall = (call.toHuman().args as Record<string, AnyJson>).call?.toString();

        if (!chain || !innerCall || !ringApisContext.state[chain]) {
          return '';
        }

        const xcmCall = ringApisContext.state[chain].createType('Call', innerCall);

        return `Execute ${ xcmCall.section }.${ xcmCall.method } call`;

      default:
        return `Execute ${ call.section }.${ call.method } call`;
    }
  };

  const processNetworkIcons = (call: Call): string[] => {
    switch (call.method) {
      case 'sendCall':
        const chain = (call.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();
        if (!chain) {
          return [];
        }

        const ring = JSON.parse(JSON.stringify(Rings))[chain];

        return [ring.icon];

      default:
        return [Rings.tinkernet?.icon as string];
    }
  };

  const processExternalCall = (fullCall: Call, call: string): Record<string, AnyJson> | string => {
    console.log('call: ', call);

    const chain = (fullCall.toHuman().args as Record<string, AnyJson>).destination?.toString().toLowerCase();

    if (!chain || ringApisContext.state[chain]) {
      return call;
    }

    const objectOrder = {
      section: null,
      method: null,
      args: null,
    };

    return Object.assign(objectOrder, ringApisContext.state[chain].createType('Call', call).toHuman());
  };

  const processSupport = (ayes: BN): number => {
    if (!saturnContext.state.multisigDetails) {
      return 0;
    }

    const totalSupply = saturnContext.state.multisigDetails.totalIssuance;

    return new BN(ayes).mul(new BN('100')).div(totalSupply).toNumber();
  };

  const processApprovalAye = (ayes: BN, nays: BN): number => new BN(ayes).mul(new BN('100')).div(new BN(ayes).add(new BN(nays))).toNumber();

  const processApprovalNay = (ayes: BN, nays: BN): number => new BN(nays).mul(new BN('100')).div(new BN(ayes).add(new BN(nays))).toNumber();

  onMount(() => {
    initAccordions();
  });

  createEffect(() => {
    const pc = pendingProposals();

    if (document && pc) {
      const parentEl = () => document.getElementById(ACCORDION_ID);
      const accordionItems = () => pc.map((p, index) => {
        const triggerEl = () => document.querySelector(`#heading${ index }`) as HTMLElement;
        const targetEl = () => document.querySelector(`#content${ index }`) as HTMLElement;

        if (p && triggerEl() && targetEl()) {
          return {
            id: `heading${ index }`,
            triggerEl: triggerEl(),
            targetEl: targetEl(),
            active: false,
          };
        }
      });

      const items = accordionItems().filter(item => item !== undefined) as FlowAccordionItem[];
      accordion = new FlowAccordion(parentEl(), items);
    }
  });

  createEffect(() => {
    setLoading(true);
    setPendingProposals([]);
    setMembers([]);
  });

  createEffect(() => {
    let timeout: any;
    const saturn = saturnContext.state.saturn;
    const multisigId = getMultisigId();

    const delayUnload = () => {
      timeout = setTimeout(() => {
        setLoading(false);
      }, 200);
    };

    const runAsync = async () => {
      if (!saturn || typeof multisigId !== 'number') {
        delayUnload();
        return;
      }

      const pendingCalls = await saturn.getPendingCalls(multisigId);
      setPendingProposals(pendingCalls);

      const members = await getAllMembers(multisigId, saturn);
      setMembers(members);

      delayUnload();
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  return (
    <div>
      <div id={ACCORDION_ID} data-accordion="collapse" class="flex flex-col">
        <Switch fallback={<div>
          {loading() ? <LoaderAnimation text="Loading transactions..." /> : <span class={FALLBACK_TEXT_STYLE}>Nothig to display.</span>}
        </div>}>
          <Match when={pendingProposals().length > 0}>
            <For each={pendingProposals()}>
              {(pc: CallDetailsWithHash, index) => <SaturnAccordionItem heading={processCallDescription(pc.details.actualCall as unknown as Call)} icon={processNetworkIcons(pc.details.actualCall as unknown as Call)} headingId={`heading${ index() }`} contentId={`content${ index() }`} onClick={() => handleAccordionClick(index())}>
                <div class="flex flex-row">
                  {/* Call data */}
                  <div class="max-h-[300px] w-full overflow-scroll my-2 grow">
                    <FormattedCall call={processCallData(pc.details.actualCall as unknown as Call, ringApisContext)} />
                  </div>

                  {/* Votes history */}
                  <For each={Object.entries(pc.details.tally.records)}>
                    {([voter, vote]: [string, ParsedTallyRecordsVote]) => {
                      const voteCount = new BN(vote.aye?.toString() || vote.nay?.toString() || '0').div(new BN('1000000')).toString();
                      return <div class='relative items-start flex shrink border border-px rounded-md border-gray-100 dark:border-gray-800 my-2 ml-2 px-2 w-3/12'>
                        <div class='flex lg:h-3 lg:w-3 md:h-3 md:w-3 rounded-full relative top-[9px] mr-1'>
                          {vote.aye
                            ? <img src={AyeIcon} />
                            : <img src={NayIcon} />
                          }
                        </div>
                        <div class='flex flex-col pt-2'>
                          <div
                            class='text-xs font-bold text-black dark:text-white'
                          >
                            {stringShorten(voter, 4)}
                          </div>
                          <div class="text-xxs text-saturn-lightgrey leading-none">
                            {` voted ${ vote.aye ? 'Aye' : 'Nay' } with ${ voteCount } ${ +voteCount > 1 ? 'votes' : 'vote' }`}
                          </div>
                        </div>
                      </div>;
                    }}
                  </For>
                </div>
                <div class="flex flex-row justify-between">
                  {/* Vote breakdown */}
                  <div class="flex flex-col rounded-md w-full border border-[1.5px] border-gray-100 dark:border-gray-800 p-4">
                    <SaturnProgress percentage={totalAyeVotes(pc.details.tally.records)} color='bg-saturn-green' label='Voted "Aye"' />
                    <SaturnProgress percentage={totalNayVotes(pc.details.tally.records)} color='bg-saturn-red' label='Voted "Nay"' />
                    <SaturnProgress percentage={totalVotes(pc.details.tally.records) / members().length * 100} overridePercentage={<span class="text-xs text-black dark:text-white">
                      <span>{totalVotes(pc.details.tally.records)}</span>
                      <span class="text-saturn-lightgrey"> / {members().length}</span>
                    </span>} color='bg-saturn-purple' label='Voter Turnout' />
                  </div>

                  {/* Support breakdown */}
                  <dl class="text-xs w-3/12 ml-3 py-2">
                    <div class="flex flex-row justify-between mb-3 text-saturn-lightgrey">
                      <dt>Support needed:</dt>
                      <dd class="text-black dark:text-white">
                        {saturnContext.state.multisigDetails?.minimumSupport.toHuman() || 'Error'}
                      </dd>
                    </div>
                    <div class="flex flex-row justify-between mb-3 text-saturn-lightgrey">
                      <dt>Approval needed:</dt>
                      <dd class="text-black dark:text-white">
                        {saturnContext.state.multisigDetails?.requiredApproval.toHuman() || 'Error'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <Show when={!hasVoted()}>
                  <div class='flex flex-row gap-3 my-3 actions'>
                    <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-green p-2 text-xs text-black justify-center w-full focus:outline-none`} onClick={() => vote(pc.callHash.toString(), true)}>Aye</button>
                    <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-red p-2 text-xs text-white justify-center w-full focus:outline-none`} onClick={() => vote(pc.callHash.toString(), false)}>Nay</button>
                  </div>
                </Show>
                <Show when={hasVoted()}>
                  <button
                    type="button"
                    class="rounded-md hover:opacity-75 bg-saturn-purple p-2 text-xs text-white justify-center w-full focus:outline-none"
                    onClick={[withdrawVote, pc]}
                  >
                    Withdraw Vote
                  </button>
                </Show>
              </SaturnAccordionItem>
              }
            </For>
          </Match>
        </Switch>
      </div>
    </div>
  );
}
