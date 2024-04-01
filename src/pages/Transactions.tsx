import { createSignal, For, createEffect, Switch, Match, onCleanup, createMemo, onMount, Show, JSX } from 'solid-js';
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
import { getEncodedAddress } from '../utils/getEncodedAddress';
import { useToast } from '../providers/toastProvider';

export const ACCORDION_ID = 'accordion-collapse';

export type QueuePageProps = {
};

export default function Transactions() {
  const [accordion, setAccordion] = createSignal<AccordionInterface | undefined>(undefined);
  const [pendingProposals, setPendingProposals] = createSignal<CallDetailsWithHash[]>([]);
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [activeIndex, setActiveIndex] = createSignal<number>(-1);

  const toast = useToast();
  const ringApisContext = useRingApisContext();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();
  const multisigHashId = loc.pathname.split('/')[1];

  const encodedAddress = createMemo(() => getEncodedAddress(selectedAccountContext.state.account?.address || '', 117));
  const getMultisigId = createMemo(() => saturnContext.state.multisigId);
  const getMultisigDetails = createMemo(() => saturnContext.state.multisigDetails);
  const isTraditionalMultisig = createMemo(() => getMultisigDetails()?.requiredApproval.toNumber() === 0);

  const hasVoted = (pc: CallDetailsWithHash) => {
    const address = encodedAddress();
    if (!address) {
      console.error('No address found for the selected account');
      return false;
    }
    const voterRecord = pc.details.tally.records[address];
    if (!voterRecord) {
      return false;
    }
    const hasAye = 'aye' in voterRecord && voterRecord.aye !== undefined;
    const hasNay = 'nay' in voterRecord && voterRecord.nay !== undefined;
    return hasAye || hasNay;
  };

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
      const ayeVotes = parseInt(record.aye?.toString() || '0', 10);
      if (!isNaN(ayeVotes)) {
        total += ayeVotes;
      }
    }

    const totalVotesCount = totalVotes(records);
    if (totalVotesCount === 0) {
      return 0;
    }
    const percentage = (total / 1000000) / totalVotesCount * 100;

    const roundedPercentage = Math.round(percentage);

    return isNaN(roundedPercentage) ? 0 : roundedPercentage;
  };

  const totalNayVotes = (records: ParsedTallyRecords): number => {
    let total = 0;

    for (let record of Object.values(records)) {
      const nayVotes = parseInt(record.nay?.toString() || '0', 10);
      if (!isNaN(nayVotes)) {
        total += nayVotes;
      }
    }

    const totalVotesCount = totalVotes(records);
    if (totalVotesCount === 0) {
      return 0;
    }
    const percentage = (total / 1000000) / totalVotesCount * 100;

    const roundedPercentage = Math.round(percentage);

    return isNaN(roundedPercentage) ? 0 : roundedPercentage;
  };

  const handleAccordionClick = (index: number) => {
    const accord = accordion();

    try {
      if (!accord || !accord._items || !accord._items.length) {
        console.error('Accordion or accordion item is not initialized or index is out of bounds');
        return;
      }

      const item = accord._items[index];
      if (!item || !item.triggerEl) {
        console.error(`Accordion item or its triggerEl at index ${ index } is undefined`);
        return;
      }

      if (item.triggerEl) {
        if (index === activeIndex()) {
          setActiveIndex(-1);
          accord.close(`content${ index }`);
        } else {
          accord.open(`content${ index }`);
          setActiveIndex(index);
        }
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
      toast.addToast('No account selected', 'error');
      return;
    }

    if (!hasVoted(pc)) {
      toast.addToast('You have not submitted a vote yet', 'error');
      return;
    }

    if (!saturn || typeof multisigId !== 'number') {
      toast.addToast('Invalid state for withdrawing vote', 'error');
      return;
    }

    toast.addToast('Processing vote withdrawal request...', 'loading');

    try {
      const call = saturn.withdrawVote({
        id: multisigId,
        callHash,
      });
      await call.signAndSend(selectedAccountAddress, { signer: selectedAccountContext.state.wallet?.signer });

      setTimeout(() => {
        toast.hideToast();
        toast.addToast('Your vote has been withdrawn', 'success');
      }, 1000);
    } catch (error) {
      setTimeout(() => {
        toast.hideToast();
        toast.addToast('An error occurred: ' + (error as any).message, 'error');
      }, 1000);
    }
  };

  const vote = async (callHash: string, aye: boolean) => {
    const selected = selectedAccountContext.state;

    if (!saturnContext.state.saturn || !selected.account || !selected.wallet?.signer || typeof saturnContext.state.multisigId !== 'number') {
      toast.addToast('Could not process your vote', 'error');
      return;
    }

    toast.addToast('Processing your vote...', 'loading');

    try {
      await saturnContext.state.saturn.vote({
        id: saturnContext.state.multisigId,
        callHash,
        aye,
      }).signAndSend(selected.account.address, { signer: selected.wallet.signer });

      setTimeout(() => {
        toast.hideToast();
        toast.addToast('Vote successfully submitted', 'success');
      }, 1000);
    } catch (error) {
      setTimeout(() => {
        toast.hideToast();
        toast.addToast('An error occurred: ' + (error as any).message, 'error');
      }, 1000);
    }
  };

  const killProposal = async (callHash: string) => {

    const saturn = saturnContext.state.saturn;
    if (!saturn || selectedAccountContext.state.account?.address === undefined || selectedAccountContext.state.wallet === undefined) {
      toast.addToast('Could not process your kill bill', 'error');
      return;
    }

    toast.addToast('Processing kill bill request...', 'loading');

    try {
      const call = saturn.api.tx.inv4.cancelMultisigProposal(callHash);
      await call.signAndSend(selectedAccountContext.state.account?.address, { signer: selectedAccountContext.state.wallet.signer });

      setTimeout(() => {
        toast.hideToast();
        toast.addToast('Kill bill successfully submitted', 'success');
      }, 1000);
    } catch (error) {
      setTimeout(() => {
        toast.hideToast();
        toast.addToast('An error occurred: ' + (error as any).message, 'error');
      }, 1000);
    }
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

  const isItemActive = (index: number) => {
    const current = activeIndex();
    return index === current;
  };

  createEffect(() => {
    const pc = pendingProposals();

    if (document && pc) {
      const parentEl = () => document.getElementById(ACCORDION_ID);
      const accordionItems = () => pc.map((p, index) => {
        const triggerEl = document.getElementById(`heading${ index }`) as HTMLElement;
        const targetEl = document.getElementById(`content${ index }`) as HTMLElement;

        if (p && triggerEl && targetEl) {
          return {
            id: `content${ index }`,
            triggerEl,
            targetEl,
            active: false,
          };
        }
      });

      const items = accordionItems().filter(item => item !== undefined) as FlowAccordionItem[];
      const accordion = new FlowAccordion(parentEl(), items);
      setAccordion(accordion);
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
      console.log('members: ', members);
      setMembers(members);

      delayUnload();
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  });

  const VoteThreshold = (): JSX.Element => {
    const minimumSupport = saturnContext.state.multisigDetails?.minimumSupport.toHuman();
    const totalMembers = members();

    return (
      <p class="text-xs text-saturn-lightgrey">
        <span class="font-bold text-white">{minimumSupport}</span> votes needed from <span class="font-bold text-white">{totalMembers.length}</span> members
      </p>
    );
  };

  return (
    <div>
      <div id={ACCORDION_ID} data-accordion="collapse" class="flex flex-col">
        <Switch fallback={<div>
          {loading() ? <LoaderAnimation text="Loading transactions..." /> : <span class={FALLBACK_TEXT_STYLE}>Nothig to display.</span>}
        </div>}>
          <Match when={pendingProposals().length > 0}>
            <For each={pendingProposals()}>
              {(pc: CallDetailsWithHash, index) => {

                return <SaturnAccordionItem heading={processCallDescription(pc.details.actualCall as unknown as Call)} icon={processNetworkIcons(pc.details.actualCall as unknown as Call)} headingId={`heading${ index() }`} contentId={`content${ index() }`} onClick={() => handleAccordionClick(index())} active={isItemActive(index())}>
                  <div class="flex flex-row">
                    {/* Call data */}
                    <div class="max-h-[300px] w-full overflow-scroll my-2 grow">
                      <FormattedCall call={processCallData(pc.details.actualCall as unknown as Call, ringApisContext)} />
                    </div>

                    {/* Votes history */}
                    <div class='relative items-start flex-col shrink border border-px rounded-md border-gray-100 dark:border-gray-800 my-2 ml-2 px-2 w-60 h-32 overflow-y-scroll saturn-scrollbar'>
                      <For each={Object.entries(pc.details.tally.records)}>
                        {([voter, vote]: [string, ParsedTallyRecordsVote]) => {
                          const voteCount = new BN(vote.aye?.toString() || vote.nay?.toString() || '0').div(new BN('1000000')).toString();
                          return <div class="flex flex-row">
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
                  </div>
                  <div class="flex flex-row justify-between">
                    {/* Vote breakdown */}
                    <div class="flex flex-col items-center justify-around gap-3 rounded-md w-full border border-[1.5px] border-gray-100 dark:border-gray-800 p-4">
                      <SaturnProgress percentage={totalAyeVotes(pc.details.tally.records)} color='bg-saturn-green' label='Voted "Aye"' />
                      <SaturnProgress percentage={totalNayVotes(pc.details.tally.records)} color='bg-saturn-red' label='Voted "Nay"' />
                      {/* <SaturnProgress percentage={totalVotes(pc.details.tally.records) / members().length * 100} overridePercentage={<span class="text-xs text-black dark:text-white">
                        <span>{totalVotes(pc.details.tally.records)}</span>
                        <span class="text-saturn-lightgrey"> / {members().length}</span>
                      </span>} color='bg-saturn-purple' label='Voter Turnout' /> */}
                    </div>

                    {/* Support breakdown and Kill button */}
                    <div class="flex flex-col justify-between ml-2 w-60">
                      <Show when={isTraditionalMultisig()}>
                        <VoteThreshold />
                      </Show>
                      <Show when={!isTraditionalMultisig()}>
                        <dl class="flex flex-col text-xs py-2">
                          <div class="flex flex-row justify-between gap-x-5 mb-3 text-saturn-lightgrey w-full">
                            <dt class="w-full">Support needed:</dt>
                            <dd class="text-black dark:text-white">
                              {saturnContext.state.multisigDetails?.minimumSupport.toHuman() || 'Error'}
                            </dd>
                          </div>
                          <div class="flex flex-row justify-between gap-5 mb-3 text-saturn-lightgrey w-full">
                            <dt class="w-full">Approval needed:</dt>
                            <dd class="text-black dark:text-white">
                              {saturnContext.state.multisigDetails?.requiredApproval.toHuman() || 'Error'}
                            </dd>
                          </div>
                        </dl>
                      </Show>
                      <div>
                        <button
                          type="button"
                          class="rounded-md hover:opacity-75 border-2 border-saturn-red p-2 text-xs text-saturn-red justify-center w-full focus:outline-none"
                          onClick={() => killProposal(pc.callHash.toString())}
                          disabled={loading()}
                        >
                          Kill Proposal
                        </button>
                      </div>
                    </div>
                  </div>
                  <Show when={!hasVoted(pc)}>
                    <div class='flex flex-row gap-3 my-3 actions'>
                      <Show when={!isTraditionalMultisig()}>
                        <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-green p-2 text-xs text-black justify-center w-full focus:outline-none font-bold`} onClick={() => vote(pc.callHash.toString(), true)}>Vote Aye</button>
                        <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-red p-2 text-xs text-white justify-center w-full focus:outline-none font-bold`} onClick={() => vote(pc.callHash.toString(), false)}>Vote Nay</button>
                      </Show>
                      <Show when={isTraditionalMultisig()}>
                        <button type="button" class={`rounded-md hover:opacity-75 bg-saturn-green p-2 text-xs text-black justify-center w-full focus:outline-none font-bold`} onClick={() => vote(pc.callHash.toString(), true)}>Approve Proposal</button>
                      </Show>
                    </div>
                  </Show>
                  <Show when={hasVoted(pc)}>
                    <div class='flex flex-row gap-3 my-3 actions'>
                      <button
                        type="button"
                        class="rounded-md hover:opacity-75 bg-saturn-yellow p-2 text-xs text-black justify-center w-full focus:outline-none font-bold"
                        onClick={[withdrawVote, pc]}
                      >
                        Withdraw Vote
                      </button>
                    </div>
                  </Show>
                </SaturnAccordionItem>;
              }
              }
            </For>
          </Match>
        </Switch>
      </div>
    </div>
  );
}
