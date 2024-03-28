import { createSignal, For, createEffect, Show, createMemo, on, onCleanup, Switch, Match } from 'solid-js';
import { BigNumber } from 'bignumber.js';
import { useSaturnContext } from "../providers/saturnProvider";
import Identity from '../components/identity/Identity';
import { getAllMembers } from '../utils/getAllMembers';
import { FALLBACK_TEXT_STYLE, INPUT_COMMON_STYLE, KusamaFeeAssetEnum, MultisigEnum } from '../utils/consts';
import RemoveIcon from '../assets/icons/remove-member-icon.svg';
import SaturnNumberInput from '../components/legos/SaturnNumberInput';
import SearchIcon from '../assets/icons/search.svg';
import LoaderAnimation from '../components/legos/LoaderAnimation';
import { useMegaModal } from '../providers/megaModalProvider';
import { BN, hexToString } from '@polkadot/util';
import { FeeAsset, MultisigCallResult } from '@invarch/saturn-sdk';
import { useSelectedAccountContext } from '../providers/selectedAccountProvider';
import { useRingApisContext } from '../providers/ringApisProvider';

export type MembersType = { address: string, votes: BigNumber; };

export default function Management() {
  let originalMembers: MembersType[];
  const [members, setMembers] = createSignal<MembersType[]>([]);
  const [search, setSearch] = createSignal<string>('');
  const [loading, setLoading] = createSignal<boolean>(true);
  const [multisigType, setMultisigType] = createSignal<MultisigEnum>(MultisigEnum.TRADITIONAL);

  const saturnContext = useSaturnContext();
  const selectedAccount = useSelectedAccountContext();
  const ringsApisContext = useRingApisContext();
  const modal = useMegaModal();

  const getMultisigId = createMemo(() => saturnContext.state.multisigId);
  const selectedState = createMemo(() => selectedAccount.state);
  const saturnState = createMemo(() => saturnContext.state);

  const removeMember = async (address: string) => {
    const tinkernetApi = ringsApisContext.state.tinkernet;
    const saturn = saturnContext.state.saturn;
    const account = selectedState().account;
    const wallet = selectedState().wallet;
    const feeAsset = selectedState().feeAsset;

    if (!tinkernetApi || !saturn || !account?.address || !wallet?.signer) return;

    const id = saturnContext.state.multisigId;

    try {
      if (id !== undefined && wallet?.signer) {
        const memberBalance = await saturn.getMultisigMemberBalance({
          id,
          address: address,
        });

        const proposeCall = saturn.proposeMemberRemoval({
          id,
          address: address,
          amount: memberBalance,
        });

        const buildCall = saturn.buildMultisigCall({
          id,
          call: proposeCall.call,
        });

        const result = await buildCall.signAndSend(account.address, wallet.signer, feeAsset === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay);

        if (result.executionResult) {
          if (result.executionResult.isErr && result.executionResult.asErr) {
            throw new Error(JSON.stringify(result.executionResult.asErr));
          } else if (result.executionResult.isOk) {
            console.log("Member removal proposed successfully");
            const newMembers = members().filter((member) => member.address !== address);
            setMembers(newMembers);
          }
        }
      }
    } catch (error) {
      console.error("Failed to propose member removal:", error);
    }
  };

  const addMember = () => {
    if (modal.showAddMemberModal) {
      modal.showAddMemberModal();
    }
  };

  const proposeNewVotingPower = async (address: string, amount: string) => {
    const tinkernetApi = ringsApisContext.state.tinkernet;
    const saturn = saturnState().saturn;
    const account = selectedState().account;
    const wallet = selectedState().wallet;
    const feeAsset = selectedState().feeAsset;

    if (!tinkernetApi || !saturn || !account?.address || !wallet?.signer) return;

    const id = saturnState().multisigId;

    try {
      if (id !== undefined && wallet?.signer) {
        const bnAmount = new BN(amount);
        const proposeCall = saturn.proposeMemberRemoval({
          id,
          address,
          amount: bnAmount,
        });

        const buildCall = saturn.buildMultisigCall({
          id,
          call: proposeCall.call,
        });

        const result: MultisigCallResult = await buildCall.signAndSend(account.address, wallet.signer, feeAsset === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay);

        if (result.executionResult) {
          if (result.executionResult.isOk) {
            alert("New members have been proposed. Please wait for the vote to pass.");
          } else if (result.executionResult.isErr) {
            const message = JSON.parse(result.executionResult.asErr.toString());
            const err = message.module.error;
            const error = hexToString(message.module.error);
            throw new Error(error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to add new members to multisig:", error);
    }
  };

  const handleSearch = (e: InputEvent) => {
    if (e.target instanceof HTMLInputElement) {
      const value = e.target.value;
      setSearch(value);
      console.log('searching for: ', search());
    }
  };

  createEffect(on(getMultisigId, () => {
    setLoading(true);
    setMembers([]);
  }));

  createEffect(on(getMultisigId, () => {
    let timeout: any;
    const saturn = saturnContext.state.saturn;
    const multisigId = getMultisigId();

    const delayUnload = () => {
      timeout = setTimeout(() => {
        setLoading(false);
      }, 200);
    };

    const runAsync = async () => {
      if (!saturn || typeof multisigId !== "number" || isNaN(multisigId)) {
        delayUnload();
        return;
      };

      const members: MembersType[] = await getAllMembers(multisigId, saturn);
      originalMembers = members;
      setMembers(members);

      delayUnload();
    };

    runAsync();

    onCleanup(() => {
      clearTimeout(timeout);
    });
  }));

  createEffect(on(search, () => {
    // filter members by search
    let filteredMembers = members().filter((member) => {
      return member.address.toLowerCase().includes(search().toLowerCase());
    });

    // handle blank value
    if (search() === '' || filteredMembers.length === 0) {
      filteredMembers = originalMembers;
    }

    setMembers(filteredMembers);
  }));

  createEffect(on(() => saturnState().multisigDetails, () => {
    const details = saturnState().multisigDetails;

    const loadMultisigDetails = async () => {
      if (!details) {
        return;
      };

      if (details.metadata && details.requiredApproval) {
        const requiredApproval = new BigNumber(details.requiredApproval.toString());
        const multisigType = requiredApproval.isZero() ? MultisigEnum.TRADITIONAL : MultisigEnum.GOVERNANCE;
        setMultisigType(multisigType);
      }
    };

    loadMultisigDetails();
  }));

  return (
    <>
      <div class="flex flex-row justify-between items-center mb-3">
        <h3 class="text-sm text-saturn-black dark:text-saturn-offwhite">Members {members() && members().length > 0 ? <span class="text-xxs text-saturn-lightgrey align-top ml-1">{members().length}</span> : null}</h3>
        <div class="flex flex-row items-center gap-3">
          <div class="relative flex items-center">
            <input class={`${ INPUT_COMMON_STYLE } pr-8`} id="searchBar" type="text" placeholder="Search by address" value={search()} onInput={handleSearch} />
            <span class="absolute float-right right-0 mr-3">
              <img src={SearchIcon} width={12} height={12} />
            </span>
          </div>
          <button class="py-2 px-4 flex flex-row rounded-md bg-saturn-purple text-xxs text-white hover:opacity-75 focus:outline-purple-500" type="button" onClick={addMember}>+ Add Member</button>
        </div>
      </div>
      <div class="relative overflow-x-scroll overscroll-contain h-full flex flex-col content-stretch">
        <table class="w-full text-sm text-left text-black dark:text-white">
          <thead class="text-xs bg-saturn-offwhite dark:bg-saturn-black">
            <tr>
              <th scope="col" class='py-3 px-4 text-left w-[50%]'>Username</th>
              <th scope="col" class='py-3 px-4 text-center w-[20%]'>Votes</th>
              <th scope="col" class='py-3 px-4 text-center w-[20%]'></th>
              <th scope="col" class='py-3 px-4 text-left w-[10%]'>Delete</th>
            </tr>
          </thead>
          <tbody>
            <Switch fallback={<div class="mt-4">
              {loading() ? <LoaderAnimation text="Loading member list..." /> : <span class={FALLBACK_TEXT_STYLE}>No members found.</span>}
            </div>}>
              <Match when={members() && members().length > 0}>
                <For each={members()}>
                  {(member, index) => {
                    const [equals, setEquals] = createSignal<boolean>(true);
                    const [votingPower, setVotingPower] = createSignal<string>("0");
                    const hide = createMemo(() => equals());
                    const initialVotingPower = createMemo(() => member.votes.div("1000000").decimalPlaces(2, 1).toString());

                    function isEqual(value: string) {
                      if (value === initialVotingPower()) {
                        setEquals(true);
                      } else {
                        setEquals(false);
                        setVotingPower(value);
                      }
                    }

                    return <tr class='border-b-[1px] border-gray-200 dark:border-gray-800'>
                      <td class='py-3 px-4 h-full font-medium'>
                        <Identity address={member.address} />
                      </td>
                      <td class='py-3 px-4 h-full'>
                        <SaturnNumberInput disabled={loading() || multisigType() === MultisigEnum.TRADITIONAL} label={`UpdateVotes-${ index() }`} min={1} max={50} initialValue={initialVotingPower()} currentValue={(value) => isEqual(value)} />
                      </td>
                      <td class='py-3 px-4'>
                        {hide() ? null : <button class="py-1 px-3 flex flex-row rounded-md bg-saturn-purple text-xxs text-white hover:opacity-75 focus:outline-purple-500" type="button" disabled={loading() || multisigType() === MultisigEnum.TRADITIONAL} onClick={() => proposeNewVotingPower(member.address, votingPower())}>Submit Proposal</button>}
                      </td>
                      <td class='py-3 px-4 h-full'>
                        <button type="button" id="removeMember" class="rounded-md hover:opacity-100 opacity-50 focus:outline-saturn-red" onClick={[removeMember, member.address]}><img class="p-2" alt="delete-icon" src={RemoveIcon} /></button>
                      </td>
                    </tr>;
                  }}
                </For>
              </Match>
            </Switch>
          </tbody>
        </table>
      </div>
    </>
  );
}
