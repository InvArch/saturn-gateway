import { For, Match, Show, Switch, createEffect, createMemo, createSignal, lazy, on, onMount } from "solid-js";
import SaturnCrumb from "../legos/SaturnCrumb";
import { BN, formatBalance, hexToString } from "@polkadot/util";
import { useLocation, useNavigate } from "@solidjs/router";
import { useRingApisContext } from "../../providers/ringApisProvider";
import { useThemeContext } from "../../providers/themeProvider";
import { useSaturnContext } from "../../providers/saturnProvider";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import { ApiTypes, FALLBACK_TEXT_STYLE, INPUT_CREATE_MULTISIG_STYLE, KusamaFeeAssetEnum, MultisigEnum } from "../../utils/consts";
import SaturnCard from "../legos/SaturnCard";
import SaturnNumberInput from "../legos/SaturnNumberInput";
import SaturnRadio from "../legos/SaturnRadio";
import GradientBgImage from "../../assets/images/gradient-bg.svg";
import FlagIcon from "../../assets/icons/flag-icon.svg";
import RemoveMemberIcon from "../../assets/icons/remove-member-icon.svg";
import AddMultisigIcon from '../../assets/icons/add-multisig-icon-15x15.svg';
import EditDataIcon from "../../assets/icons/edit-data-icon.svg";
import AyeIcon from "../../assets/icons/aye-icon-17x17.svg";
import NayIcon from "../../assets/icons/nay-icon-17x17.svg";
import CheckIcon from "../../assets/icons/check.svg";
import { isValidPolkadotAddress } from "../../utils/isValidPolkadotAddress";
import { isValidKiltWeb3Name } from "../../utils/isValidKiltWeb3Name";
import LoaderAnimation from "../legos/LoaderAnimation";
import ConnectWallet from "../top-nav/ConnectWallet";
import { ADD_MEMBER_MODAL_ID, MULTISIG_MODAL_ID } from "../left-side/AddMultisigButton";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { Call } from "@polkadot/types/interfaces";
import { ISubmittableResult } from "@polkadot/types/types/extrinsic";
import BigNumber from "bignumber.js";
import { FeeAsset, MultisigCallResult } from "@invarch/saturn-sdk";
import { useMegaModal } from "../../providers/megaModalProvider";
import debounce from "../../utils/debounce";

const EllipsisAnimation = lazy(() => import('../legos/EllipsisAnimation'));

const THRESHOLD_TEXT_STYLE = "text-xxs p-2 border border-saturn-lightgrey rounded-md text-black dark:text-white";
const SECTION_TEXT_STYLE = "text-black dark:text-white text-lg mb-3";
const LIST_LABEL_STYLE = "text-saturn-darkgrey dark:text-white text-xxs mb-1";

export const MULTISIG_CRUMB_TRAIL = ['Choose Name', 'Select Type', 'Add Members', 'Set Thresholds', 'Review', 'success']; // MULTISIG_CRUMB_TRAIL key: [0 = 'Choose Name', 1 = 'Select Type', 2 = 'Add Members', 3 = 'Set Thresholds', 4 = 'Review', 5 = 'success']

interface CreateMultisigProps {
  limitSteps?: string[];
}

const CreateMultisig = (props: CreateMultisigProps) => {
  const navigate = useNavigate();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const ringApisContext = useRingApisContext();
  const theme = useThemeContext();
  const modal = useMegaModal();
  const loc = useLocation();

  const accessibleSteps = createMemo(() => {
    return props.limitSteps && props.limitSteps.length ? MULTISIG_CRUMB_TRAIL.filter((step) => props.limitSteps?.includes(step)) : MULTISIG_CRUMB_TRAIL;
  });
  const multisigModalType = createMemo(() => {
    return accessibleSteps().length !== MULTISIG_CRUMB_TRAIL.length ? ADD_MEMBER_MODAL_ID : MULTISIG_MODAL_ID;
  });
  const initFirstStep = createMemo(() => {
    const step = accessibleSteps().length !== MULTISIG_CRUMB_TRAIL.length ? accessibleSteps()[0] : MULTISIG_CRUMB_TRAIL[0];
    return step;
  });

  const [active, setActive] = createSignal<string>(MULTISIG_CRUMB_TRAIL[0], { equals: false });
  const [multisigName, setMultisigName] = createSignal('');
  const [members, setMembers] = createSignal<[string, number][]>([], { equals: false });
  const [currentMembers, setCurrentMembers] = createSignal<string[]>([]);
  const [minimumSupportField, setMinimumSupportField] = createSignal<string>('50');
  const [requiredApprovalField, setRequiredApprovalField] = createSignal<string>('50');
  const [multisigType, setMultisigType] = createSignal<MultisigEnum>(MultisigEnum.TRADITIONAL);
  const [textHint, setTextHint] = createSignal<string>('');
  const [nameError, setNameError] = createSignal<string>('');
  const [hasAddressError, setHasAddressError] = createSignal<number[]>([]);
  const [finishing, setFinishing] = createSignal<boolean>(false);
  const [disableAddMember, setDisableAddMember] = createSignal<boolean>(false);
  const [coreCreationFee, setCoreCreationFee] = createSignal<string>("100");
  const [tnkrBalance, setTnkrBalance] = createSignal<string>("0");
  const [feeAsset, setFeeAsset] = createSignal<KusamaFeeAssetEnum>(KusamaFeeAssetEnum.TNKR);

  const getCurrentStep = () => {
    // get current step in crumb trail
    return active();
  };

  const isLoggedIn = createMemo(() => !!selectedAccountContext.state.account?.address);
  const selectedState = createMemo(() => selectedAccountContext.state);
  const saturnState = createMemo(() => saturnContext.state);
  const isLightTheme = createMemo(() => theme.getColorMode() === 'light');
  const lessThan1200 = createMemo(() => window.matchMedia('(max-width: 1200px)').matches);
  const totalSupportCount = createMemo(() => {
    // number of total members in multisig
    const party = members();
    return party.length;
  });
  const totalApprovalCount = createMemo(() => {
    // number of votes required to approve a proposal
    const party = members();
    let total = 0;

    for (const [_, weight] of party) {
      total += parseInt(weight.toString());
    }
    return total;
  });
  const disableCrumbs = createMemo(() => {
    // check if any fields are invalid and disable crumbs accordingly
    if (multisigName() === '' || nameError()) {
      return accessibleSteps().filter(crumb => crumb !== accessibleSteps()[0]);
    }

    if (multisigModalType() === ADD_MEMBER_MODAL_ID) {
      const hasErrors = hasAddressError().length > 0;
      return hasErrors ? accessibleSteps().filter(crumb => crumb !== accessibleSteps()[0]) : [];
    }

    if (finishing()) {
      console.log('finishing');
      // disable everything
      return accessibleSteps();
    }

    return [];
  });
  const inReviewStep = createMemo(() => {
    // check if on next to last crumb trail
    return getCurrentStep() === (multisigModalType() === ADD_MEMBER_MODAL_ID ? accessibleSteps()[1] : MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 2]);
  });
  const notEnoughBalance = createMemo(() => {
    // check if user has enough balance to create multisig
    if (coreCreationFee() && tnkrBalance()) {
      return new BigNumber(coreCreationFee()).gt(new BigNumber(tnkrBalance()));
    }
    return false;
  });

  const createMultisig = async () => {
    // create multisig
    setFinishing(true);

    if (accessibleSteps().length !== MULTISIG_CRUMB_TRAIL.length) return;

    const account = selectedState().account;
    const wallet = selectedState().wallet;
    const saturn = saturnState().saturn;
    const tinkernetApi = ringApisContext.state.tinkernet;

    if (!saturn || !wallet || !account) return;

    wallet.connect();

    const name = multisigName();
    const requiredApproval = requiredApprovalField();
    const minimumSupport = minimumSupportField();
    const multisigParty = members();

    if (!name || !wallet.signer) {
      return;
    };

    let ms = parseFloat(minimumSupport);
    let ra = parseFloat(requiredApproval);

    if (!ms) return;

    ms = ms * 10000000;
    ra = ra * 10000000;

    const createMultisigResult = await saturn.createMultisig({
      minimumSupport: new BN(ms),
      requiredApproval: new BN(ra),
      creationFeeAsset: feeAsset() === KusamaFeeAssetEnum.TNKR ? FeeAsset.Native : FeeAsset.Relay,
    }).signAndSend(account.address, wallet.signer);

    console.log("createMultisigResult: ", createMultisigResult);

    const multisigAddress = createMultisigResult.account.toHuman();
    const multisigId = createMultisigResult.id;

    let innerCalls = [
      tinkernetApi.tx.identity.setIdentity({ display: { Raw: name } })
    ];

    if (multisigParty && typeof multisigParty === 'object') {
      // loop through multisigParty and add vote weight for each member
      for (const [address, weight] of multisigParty) {
        if (address !== account.address) {
          const votes = weight * 1000000;
          innerCalls.push(tinkernetApi.tx.inv4.tokenMint(votes, address));
        }
      }
    }

    const calls = [
      tinkernetApi.tx.balances.transferKeepAlive(multisigAddress, new BN("7000000000000")),
      saturn.buildMultisigCall({
        id: multisigId,
        call: tinkernetApi.tx.utility.batchAll(innerCalls) as unknown as SubmittableExtrinsic<ApiTypes, ISubmittableResult>,
      }).call as Uint8Array | Call | SubmittableExtrinsic<ApiTypes, ISubmittableResult>
    ];

    try {
      tinkernetApi.tx.utility.batchAll(calls).signAndSend(account.address, { signer: wallet.signer }, (result: ISubmittableResult) => {
        setActive(MULTISIG_CRUMB_TRAIL[MULTISIG_CRUMB_TRAIL.length - 1]); // 'success'

        if (result.status.isFinalized || result.status.isInBlock) {
          navigate(`/${ multisigId }/assets`, { resolve: false, replace: true });

          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      wallet.disconnect();
    }
  };

  const proposeNewMembers = async () => {
    const tinkernetApi = ringApisContext.state.tinkernet;
    const saturn = saturnState().saturn;
    const account = selectedState().account;
    const wallet = selectedState().wallet;
    const feeAsset = selectedState().feeAsset;

    if (!tinkernetApi || !saturn || !account?.address || !wallet?.signer) return;

    const id = saturnState().multisigId;

    try {
      if (id !== undefined && wallet?.signer) {
        const wrappedCalls = await Promise.all(members().map(async ([address, initialBalance]) => {
          const processedAddress = address.includes(':') ? address.split(':')[1] : address;
          const amount = new BN(initialBalance);
          const proposeCall = saturn.proposeNewMember({
            id,
            address: processedAddress,
            amount,
          });

          return proposeCall.call;
        }));

        const call = tinkernetApi.tx.utility.batchAll(wrappedCalls);

        const buildCall = saturn.buildMultisigCall({
          id,
          call,
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

  const handleSetActive = (crumb: string) => {
    if (accessibleSteps().includes(crumb)) {
      setActive(crumb);
    }
  };

  const handleSetMultisigName = (e: any) => {
    // set multisig name
    try {
      // first clear any previous errors
      setNameError('');
      // throw an error if it's too long
      if (e.target.value.length > 20) {
        throw new Error('Multisig name cannot be longer than 20 characters.');
      }
      // throw an error if it's empty
      if (e.target.value === '') {
        throw new Error('Multisig name cannot be empty.');
      }
      // throw an error if it's not alphanumeric
      if (!e.target.value.match(/^[a-z0-9]+$/i)) {
        throw new Error('Multisig name must be alphanumeric (letters and numbers).');
      }
      setMultisigName(e.target.value);
    } catch (error) {
      console.error(error);
      setNameError((error as any).message);
    }
  };

  const handleSetMultisigType = (type: MultisigEnum) => {
    // set multisig type and associated fields
    if (type === MultisigEnum.TRADITIONAL) {
      setRequiredApprovalField('0');
    } else {
      setRequiredApprovalField('50');
    }
    setMultisigType(type);
  };

  const isStepAccessible = (step: string): boolean => {
    // If limitSteps is not defined, all steps are accessible
    if (!props.limitSteps || props.limitSteps.length === 0) {
      return true;
    }
    // Check if the current step is included in limitSteps
    return props.limitSteps.includes(step);
  };

  const getNextStep = () => {
    const currentStep = getCurrentStep();
    const steps = accessibleSteps();
    let currentIndex = steps.indexOf(currentStep);
    let nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      return steps[nextIndex];
    }
    return null;
  };

  const isNextToLastStep = () => {
    const currentStep = getCurrentStep();
    return currentStep === accessibleSteps()[accessibleSteps().length - 1];
  };

  const goForward = () => {
    let currentIndex = accessibleSteps().indexOf(getCurrentStep());
    let nextIndex = currentIndex + 1;
    while (nextIndex < accessibleSteps().length && !isStepAccessible(accessibleSteps()[nextIndex])) {
      nextIndex++;
    }
    if (nextIndex < accessibleSteps().length) {
      setActive(accessibleSteps()[nextIndex]);
    }
  };

  const goBack = () => {
    let currentIndex = accessibleSteps().indexOf(getCurrentStep());
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0 && !isStepAccessible(accessibleSteps()[prevIndex])) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      setActive(accessibleSteps()[prevIndex]);
    } else {
      removeModal();
    }
  };

  const addMember = () => {
    const currentMembers = members();
    let newMembers: [string, number][];

    if (multisigModalType() === MULTISIG_MODAL_ID) {
      newMembers = [...currentMembers, ['', 1]];
    } else {
      if (currentMembers.length === 0) {
        newMembers = [['', 1]];
      } else {
        newMembers = [...currentMembers, ['', 1]];
      }
    }

    setMembers(newMembers);

    // Scroll to the bottom of the saturn-scrollbar element and focus on the new input
    const scrollContainer = document.getElementById('additionalMembers');
    if (scrollContainer) {
      const newInputElement = scrollContainer.lastElementChild?.querySelector('input');
      newInputElement?.focus();
      scrollContainer.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const removeMember = (index: number) => {
    // remove member from members()
    const currentMembers = members();
    const newMembers = currentMembers.filter((_, i) => i !== index);
    setMembers(newMembers);

    // remove this index from hasAddressError array
    const newHasAddressError = hasAddressError().filter((i) => i !== index);
    setHasAddressError(newHasAddressError);
    setDisableAddMember(false);
  };

  const abortUi = () => {
    // reset all state
    setMultisigName('');
    setMembers([]);
    setMinimumSupportField('50');
    setRequiredApprovalField('50');
    setActive(accessibleSteps()[0]);
    setSelfAddress();
    setFinishing(false);
  };

  const setSelfAddress = () => {
    const selected = selectedAccountContext.state;
    const address = selected.account?.address;
    if (address) {
      setMembers([[address, 1]]);
    }
  };

  const removeModal = () => {
    const instance = modal;
    if (multisigModalType() === ADD_MEMBER_MODAL_ID) {
      instance.hideAddMemberModal();
    } else {
      instance.hideCreateMultisigModal();
    }
  };

  const validateInput = async (inputValue: string, memberIndex: number) => {
    if (!inputValue) return;

    if (inputValue === '') {
      setDisableAddMember(true);
      setHasAddressError(current => [...current, memberIndex]);
    } else {
      setDisableAddMember(false);
      setHasAddressError(current => current.filter(i => i !== memberIndex));
    }

    let isValidAddress;
    let addressFromWeb3Name: string | null = null;

    try {
      isValidAddress = isValidPolkadotAddress(inputValue);
    } catch (error) {
      console.error(error);
      isValidAddress = false;
      setHasAddressError(current => [...current, memberIndex]);
    }

    try {
      if (!isValidAddress) {
        const web3Name = await isValidKiltWeb3Name(inputValue);
        addressFromWeb3Name = web3Name;
        isValidAddress = web3Name !== '';
      } else {
        setHasAddressError(current => current.filter(i => i !== memberIndex));
        setDisableAddMember(false);
      }
    } catch (error) {
      console.error(error);
      isValidAddress = false;
      setHasAddressError(current => [...current, memberIndex]);
    }

    const isUnique = members().every((member, index) => index === memberIndex || member[0] !== inputValue);

    const isInMultisig = currentMembers().some((member) => member.toString() === addressFromWeb3Name);

    const newMembers = [...members()];
    while (newMembers.length <= memberIndex) {
      newMembers.push(['', 1]);
    }

    if (isValidAddress && isUnique && !isInMultisig) {
      newMembers[memberIndex][0] = addressFromWeb3Name ? (inputValue + ':' + addressFromWeb3Name) : inputValue;
      setMembers(newMembers);
      setHasAddressError(current => current.filter(i => i !== memberIndex));
      setDisableAddMember(false);
      return false;
    } else {
      setHasAddressError(current => [...current, memberIndex]);
      setDisableAddMember(true);
      console.error('Member address is invalid, a duplicate, or already in the multisig.');
      return true;
    }
  };

  const debouncedValidateInput = debounce(validateInput, 500);

  onMount(() => {
    abortUi();
  });

  onMount(() => {
    const feeCurrency = selectedAccountContext.setters.getFeeAsset();
    setFeeAsset(feeCurrency);
  });

  onMount(() => {
    setActive(initFirstStep());
  });

  createEffect(on([() => saturnState().multisigDetails, multisigModalType], () => {
    const details = saturnState().multisigDetails;
    const inAddMemberModal = multisigModalType() === ADD_MEMBER_MODAL_ID;

    const loadMultisigDetails = async () => {
      if (!details) {
        return;
      };

      if (inAddMemberModal && details.metadata && details.requiredApproval) {
        const multisigName = hexToString(details.metadata);
        const requiredApproval = new BigNumber(details.requiredApproval.toString());
        const multisigType = requiredApproval.isZero() ? MultisigEnum.TRADITIONAL : MultisigEnum.GOVERNANCE;
        setMultisigName(multisigName);
        setMultisigType(multisigType);
      }
    };

    loadMultisigDetails();
  }));

  createEffect(() => {
    // set self address as first member
    if (multisigModalType() === MULTISIG_MODAL_ID) {
      setSelfAddress();
    }
  });

  createEffect(() => {
    if (multisigModalType() === ADD_MEMBER_MODAL_ID) {
      let foundEmptyAddress = false;
      let newHasAddressError = [];

      for (let index = 0; index < members().length; index++) {
        const [address] = members()[index];
        if (address === '') {
          foundEmptyAddress = true;
          newHasAddressError.push(index);
          break;
        }
      }

      setDisableAddMember(foundEmptyAddress || members().length === 0);
      setHasAddressError(newHasAddressError);

      if (!foundEmptyAddress && members().length > 0) {
        setDisableAddMember(false);
      }
    }
  });

  createEffect(() => {
    const tinkernetApi = ringApisContext.state.tinkernet;

    const getCreationFee = async () => {
      if (tinkernetApi) {
        const fee = tinkernetApi.consts.inv4.coreCreationFee;
        const formattedFee = formatBalance(fee.toString(), { decimals: 12, withUnit: false });
        setCoreCreationFee(formattedFee);
      }
    };

    getCreationFee();
  });

  createEffect(() => {
    const rings = ringApisContext;
    const address = selectedAccountContext.state.account?.address;

    const getBalance = async () => {
      try {
        if (!rings.state.tinkernet || !address) return;

        await rings.state.tinkernet.query.system.account(address, (account: any) => {
          const balance = account.toPrimitive();
          const total = new BigNumber(balance.data.free.toString());
          const frozen = new BigNumber(balance.data.frozen.toString());
          const reserved = new BigNumber(balance.data.reserved.toString());
          const transferable = total.minus(frozen).minus(reserved);
          const formattedBalance = transferable.div(new BigNumber(10).pow(12));
          setTnkrBalance(formattedBalance.toString());
        });
      } catch (error) {
        console.error(error);
      }
    };

    getBalance();
  });

  createEffect(() => {
    // set default threshold values when multisigType changes 
    if (multisigModalType() === MULTISIG_MODAL_ID && getCurrentStep() === accessibleSteps()[2]) {
      const supportCount = totalSupportCount();
      const approvalCount = totalApprovalCount();

      if (multisigType() === MultisigEnum.TRADITIONAL) {
        setRequiredApprovalField('0');
      }

      // if (multisigType() === MultisigEnum.TRADITIONAL) {
      //   setRequiredApprovalField('0');
      // } else {
      //   setRequiredApprovalField(approvalCount.toString());
      // }

      // if (supportCount > 0) {
      //   setMinimumSupportField(supportCount.toString());
      // }
    }
  });

  createEffect(() => {
    if (multisigModalType() === ADD_MEMBER_MODAL_ID) {
      switch (getCurrentStep()) {
        case accessibleSteps()[0]:
          setTextHint('Enter the address of the member you would like to invite.');
          break;
        case accessibleSteps()[1]:
          setTextHint('Review before submitting for proposal.');
          break;
      }
      return;
    }

    // update textHint() when active() crumb trail changes for MULTISIG_MODAL_ID
    switch (getCurrentStep()) {
      case accessibleSteps()[0]:
        setTextHint('This can be the name of your organization, community, department, or anything you like.');
        break;
      case accessibleSteps()[1]:
        setTextHint('Choose between a traditional multisig or a governance/DAO-style multisig.');
        break;
      case accessibleSteps()[2]:
        setTextHint('You can add as many members as you need and customize their voting weight (can add more later).');
        break;
      case accessibleSteps()[3]:
        setTextHint('Vote thresholds are the minimum number of votes required to pass a proposal.');
        break;
      case accessibleSteps()[4]:
        setTextHint(!notEnoughBalance() ? `Make sure to have more than ${ coreCreationFee() } TNKR in your account to create this multisig.` : `Cannot create multisig with insufficient balance (${ coreCreationFee() } TNKR required).`);
        break;
      case accessibleSteps()[5]:
        setFinishing(false);
        setTextHint('Congratulations! Now get to work.');
        break;
      default:
        setTextHint('');
        break;
    }
  });

  createEffect(on(members, () => {
    // When navigating away from the members step, clear members with blank addresses
    if (getCurrentStep() !== (multisigModalType() === ADD_MEMBER_MODAL_ID ? accessibleSteps()[0] : MULTISIG_CRUMB_TRAIL[2]) && members().length > 1) {
      const filteredMembers = members().filter(([address, _], index) => {
        // return !hasAddressError().includes(index) && address !== '';
        return address !== '';
      });
      console.log('filteredMembers: ', filteredMembers);
      setMembers(filteredMembers);

      // Reset the error state as well
      setHasAddressError([]);
      setDisableAddMember(false);
    }
  }));

  createEffect(() => {
    const saturn = saturnState().saturn;
    const hashId = loc.pathname.split('/')[1];

    if (!saturn || !hashId || hashId === 'undefined') {
      console.error('Saturn or hashId not available');
      return;
    };

    const loadMembers = async () => {
      const members = await saturn.getMultisigMembers(Number(hashId));
      const humanReadableMembers = members.map(member => member.toHuman());
      setCurrentMembers(humanReadableMembers);
    };

    loadMembers();
  });

  const ToCrumb = (props: { crumb: string; }) => {
    // scroll to crumb
    return <button disabled={finishing()} onClick={[handleSetActive, props.crumb]} type="button" class="focus:outline-none ml-1 opacity-50 hover:opacity-100 p-1 rounded-md border border-px border-saturn-lightgrey"><img src={EditDataIcon} /></button>;
  };

  const STEP_LOGIN = () => (
    <div class="text-black dark:text-white" id="STEP_LOGIN">
      <div class={SECTION_TEXT_STYLE}>Connect your Substrate-based wallet to continue.</div>
      <ConnectWallet inMultisig={true} />
    </div>
  );

  const STEP_1_NAME = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[0]}>
      <div class={SECTION_TEXT_STYLE}>First, let's start with a name!</div>
      <input tabIndex={1} type="text" class={`${ INPUT_CREATE_MULTISIG_STYLE } w-5/6`} value={multisigName()} onInput={handleSetMultisigName} />
      <Show when={nameError()}>
        <div class="text-xxs text-saturn-red mt-2">{nameError()}</div>
      </Show>
    </div>
  );

  const STEP_2_SELECT_TYPE = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[1]}>
      <div class={SECTION_TEXT_STYLE}>Second, select a multisig type.</div>
      <p class="text-xs/none">Traditional multisigs are used for simple, straightforward voting where 1 voter = 1 vote.</p>
      <p class="text-xs/none mt-3">Governance multisigs are used for more complex voting scenarios (i.e., DAOs).</p>
      <div class="my-5">
        <SaturnRadio direction="row" selected={multisigType()} options={[MultisigEnum.TRADITIONAL, MultisigEnum.GOVERNANCE]} setSelected={(type: MultisigEnum) => handleSetMultisigType(type)} />
      </div>
    </div>
  );

  const STEP_3_MEMBERS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[2]}>
      <div class={SECTION_TEXT_STYLE}>{`${ multisigModalType() === ADD_MEMBER_MODAL_ID ? 'Invite additional' : 'Next, invite some' } users into the organization.`}</div>

      {/* First row is the multisig creator's address */}
      <div class="flex flex-row items-end gap-2 mb-2">
        <div class={`relative flex flex-col ml-2 md:w-[440px] ${ multisigType() === MultisigEnum.GOVERNANCE ? 'w-2/5' : 'w-5/6' }`}>
          <Show when={multisigModalType() === MULTISIG_MODAL_ID}>
            <span class="absolute left-[-7px] top-[33px]"><img src={AyeIcon} width={12} height={12} /></span>
          </Show>
          <label for="defaultMember" class={LIST_LABEL_STYLE}>Address</label>
          <Switch>
            <Match when={hasAddressError().includes(0)}>
              <span class="absolute left-[-7px] top-[33px]"><img src={NayIcon} width={12} height={12} /></span>
            </Match>
            <Match when={!hasAddressError().includes(0)}>
              <span class="absolute left-[-7px] top-[33px]"><img src={AyeIcon} width={12} height={12} /></span>
            </Match>
          </Switch>
          <input id="defaultMember" name="defaultMember" disabled={multisigModalType() === MULTISIG_MODAL_ID} type="text" class={`${ INPUT_CREATE_MULTISIG_STYLE }`} value={members()[0] ? members()[0][0] : ''} onInput={(e) => debouncedValidateInput(e.target.value, 0)} />
        </div>
        <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
          <div>
            <label for="defaultVotes" class={`${ LIST_LABEL_STYLE } ml-5`}>Votes</label>
            <SaturnNumberInput isMultisigUi label="defaultVotes" id="defaultVotes" min={1} max={50} initialValue={members()[0]?.[1]?.toString() || '1'} currentValue={(votes: string) => {
              const newMembers = members();
              newMembers[0][1] = parseInt(votes);
              setMembers(newMembers);
            }} />
          </div>
        </Show>
        <button type="button" class="px-4 py-[12px] bg-saturn-purple rounded-md hover:bg-purple-600 focus:outline-purple-500 text-md" disabled={disableAddMember()} onClick={addMember}><img alt="Add another member" src={AddMultisigIcon} class="h-4 w-4" /></button>
      </div>

      {/* Scrollable list of additional members */}
      <Show when={members().length > 1}>
        <div id="additionalMembers" class={`saturn-scrollbar h-[130px] pr-1 overflow-y-auto pb-2 ${ isLightTheme() ? 'islight' : 'isdark' }`}>
          <For each={members()}>
            {([address, weight], index) => {

              const shouldShow = () => {
                if (multisigModalType() === ADD_MEMBER_MODAL_ID && index() === 0) {
                  return false;
                } else if (multisigModalType() === MULTISIG_MODAL_ID && address === selectedState().account?.address) {
                  return false;
                }
                return true;
              };

              return (
                <Show when={shouldShow()}>
                  <div class={`flex flex-row items-center gap-2 mb-2 w-full ${ multisigType() === MultisigEnum.GOVERNANCE ? 'max-w-[515px]' : 'max-w-[489px]' }`}>
                    <div class="relative ml-2 flex-grow">
                      <Switch>
                        <Match when={hasAddressError().includes(index())}>
                          <span class="absolute left-[-7px] top-[15px]"><img src={NayIcon} width={12} height={12} /></span>
                        </Match>
                        <Match when={!hasAddressError().includes(index())}>
                          <span class="absolute left-[-7px] top-[15px]"><img src={AyeIcon} width={12} height={12} /></span>
                        </Match>
                      </Switch>
                      <input id={`text-${ index() }`} type="text" class={`${ INPUT_CREATE_MULTISIG_STYLE } w-full`} value={address}
                        onInput={(e) => debouncedValidateInput(e.target.value, index())}
                      />
                    </div>
                    <div class="relative flex flex-row items-center gap-2">
                      <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
                        <SaturnNumberInput isMultisigUi label={`votes-${ index() }`} min={1} max={50} initialValue={weight.toString()} currentValue={(votes: string) => {
                          const newMembers = members();
                          newMembers[index()][1] = parseInt(votes);
                          setMembers(newMembers);
                        }} />
                      </Show>
                      <div class={`px-2 relative top-[3px] ${ multisigType() === MultisigEnum.GOVERNANCE ? 'left-[-13px] sm:left-0' : '' }`}>
                        <button type="button" disabled={index() === 0} onClick={() => removeMember(index())} class="focus:outline-none opacity-75 hover:opacity-100 h-[15px] w-[17px]"><img src={RemoveMemberIcon} alt="RemoveMember" class="h-[15px] w-[17px]" /></button>
                      </div>
                    </div>
                  </div>
                </Show>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );

  const STEP_4_VOTE_THRESHOLD = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[3]}>
      <div class={SECTION_TEXT_STYLE}>Now, set the voting thresholds.</div>
      <p class="text-xs/none">Minimum support is the minimum number of votes required to pass a proposal.</p>
      {multisigType() === MultisigEnum.GOVERNANCE && <p class="text-xs/none mt-3">Required approval is the minimum number of votes required to approve a proposal.</p>}
      <div class="flex flex-row items-center justify-start gap-2 sm:gap-5 my-4">
        <div class="flex flex-row items-center gap-1">
          <label for="minimumSupport" class={`${ FALLBACK_TEXT_STYLE } text-left text-[10px]/none`}>Minimum Support (%)</label>
          <SaturnNumberInput isMultisigUi label="minimumSupport" initialValue={minimumSupportField()} currentValue={(support) => setMinimumSupportField(support)} min={1} max={100} />
        </div>
        <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
          <div class="flex flex-row items-center gap-1">
            <label for="requiredApproval" class={`${ FALLBACK_TEXT_STYLE } text-left text-[10px]/none`}>Required Approval (%)</label>
            <SaturnNumberInput isMultisigUi label="requiredApproval" disabled={multisigType() === MultisigEnum.TRADITIONAL} initialValue={requiredApprovalField()} currentValue={(approval) => setRequiredApprovalField(approval)} min={1} max={100} />
          </div>
        </Show>
      </div>
    </div>
  );

  const STEP_5_CONFIRM = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[4]}>
      <div class={SECTION_TEXT_STYLE}>Finally, do one last spot-check.</div>
      <dl class="mt-2 text-xs final-checklist max-h-[200px] overflow-y-scroll saturn-scrollbar pr-3">
        <Show when={multisigModalType() === MULTISIG_MODAL_ID}>
          <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
            <dt class="text-xxs text-right w-24 mr-5">Name <ToCrumb crumb="Choose a Name" /></dt>
            <dd class="text-black dark:text-white">{multisigName()}</dd>
          </div>
        </Show>
        <Show when={multisigModalType() === MULTISIG_MODAL_ID}>
          <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
            <dt class="text-xxs text-right w-24 mr-5">Multisig Type <ToCrumb crumb="Select Type" /></dt>
            <dd class="text-black dark:text-white">{multisigType()}</dd>
          </div>
        </Show>
        <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
          <dt class="text-xxs text-right w-24 mr-5">Members <ToCrumb crumb="Add Members" /></dt>
          <dd class="text-black dark:text-white border border-saturn-lightgrey rounded-md p-3 w-4/6">
            <div class={`pr-3 pb-3 h-[120px] saturn-scrollbar overflow-y-auto ${ isLightTheme() ? 'islight' : 'isdark' }`}>
              <For each={members()}>
                {([address, weight], index) => (
                  <div class="flex flex-row items-center mb-2 pr-3 text-black dark:text-white">
                    <span class="pr-1">({weight})</span>
                    <span class="pr-3">{address}</span>
                  </div>
                )}
              </For>
            </div>
          </dd>
        </div>
        <Show when={multisigModalType() === MULTISIG_MODAL_ID}>
          <div class="flex flex-row items-center place-items-stretch pb-4 text-saturn-lightgrey">
            <dt class="text-xxs text-right w-24 mr-5">Thresholds <ToCrumb crumb="Set Voting Thresholds" /></dt>
            <dd>
              <div>
                <span class="text-saturn-lightgrey text-xxs">Minimum Support:
                  <span class="text-black dark:text-white ml-2 text-xs float-right">
                    {minimumSupportField()}%
                  </span>
                </span>
                <Show when={multisigType() === MultisigEnum.GOVERNANCE}>
                  <br />
                  <span class="text-saturn-lightgrey text-xxs">Required Approval:
                    <span class="text-black dark:text-white ml-2 text-xs float-right">
                      {requiredApprovalField()}%
                    </span>
                  </span>
                </Show>
              </div>
            </dd>
          </div>
        </Show>
      </dl>
    </div>
  );

  const STEP_6_SUCCESS = () => (
    <div class="text-black dark:text-white" id={MULTISIG_CRUMB_TRAIL[5]}>
      {multisigModalType() === MULTISIG_MODAL_ID ? <div class={SECTION_TEXT_STYLE}>The multisig has been created and is almost ready. You will be automatically redirected to the Assets page<EllipsisAnimation /></div> : <div class={SECTION_TEXT_STYLE}>Please note that invited users need to be voted in prior to becoming a member. You will be automatically redirected to the Transactions page in a few seconds<EllipsisAnimation /></div>}
    </div>
  );

  return (
    <>
      <div id={multisigModalType()} tabindex="-1" aria-hidden="true" class="fixed top-0 left-0 right-0 hidden mx-auto md:p-4 md:mb-10 z-[60] w-auto">
        <div id="multisigModalBackdrop" class="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm z-1 w-full" />
        <div class="absolute top-[10px] right-2.5 mb-8 z-[90]">
          <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-purple-900 dark:hover:text-white" onClick={removeModal}>
            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <div class="flex flex-col px-5 lg:px-2 xs:pt-1 lg:pt-0 z-[60] mt-8 w-full max-w-[1200px]">
          <Show when={!!getCurrentStep()}>
            <Show when={multisigModalType() === MULTISIG_MODAL_ID && !isNextToLastStep() || multisigModalType() === ADD_MEMBER_MODAL_ID}>
              <SaturnCrumb trail={accessibleSteps()} disabledCrumbs={disableCrumbs()} active={getCurrentStep()} setActive={handleSetActive} trailWidth="max-w-full" />
            </Show>
            <SaturnCard noPadding>
              <div class={`p-5 ${ lessThan1200() ? 'h-auto' : 'h-96' }`}>
                <div class={`${ lessThan1200() ? 'flex flex-col' : 'grid grid-cols-4 gap-2 place-items-start lg:place-items-center' } h-full`}>
                  <div class={`${ lessThan1200() ? '' : 'lg:col-span-2 col-span-1 lg:h-44' } px-3`}>
                    <h3 class={`text-2xl/none sm:text-3xl/12 md:text-[5vw] lg:text-[3vw]/none h-auto min-h-[60px] sm:min-h-[90px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ECD92F] via-[#FF4D90] to-[#692EFF] ${ lessThan1200() ? 'mb-3' : 'mb-10' }`}>
                      <Show when={multisigModalType() === MULTISIG_MODAL_ID}>
                        {
                          !isNextToLastStep() ?
                            <span>
                              Create a new{lessThan1200() ? ' ' : <br />}Saturn Multisig
                            </span> :
                            <span class="flex flex-col items-center">
                              <img src={CheckIcon} width={80} height={80} />
                              <span class="mt-5 break-words">You're All Set!</span>
                            </span>
                        }
                      </Show>
                      <Show when={multisigModalType() === ADD_MEMBER_MODAL_ID}>
                        <span>
                          Edit your{lessThan1200() ? ' ' : <br />}Saturn Multisig
                        </span>
                      </Show>
                    </h3>
                    <Show when={multisigModalType() === MULTISIG_MODAL_ID && !isNextToLastStep() || multisigModalType() === ADD_MEMBER_MODAL_ID}>
                      <h6 class="text-xs md:text-sm text-black dark:text-white italic">A Multisig is an account that is managed by one or more owners <br /> using multiple accounts.</h6>
                    </Show>
                  </div>
                  <div class={`${ lessThan1200() ? 'flex flex-col' : 'lg:col-span-2 col-span-3 mx-8' } bg-image`} style={{ 'background-image': `url(${ GradientBgImage })`, 'background-position': 'left' }}>
                    <div class={`flex flex-col justify-center bg-gray-950 bg-opacity-[.03] backdrop-blur rounded-md w-full h-full ${ lessThan1200() ? 'px-3 py-5' : 'p-5' }`}>
                      <Show when={multisigModalType() === MULTISIG_MODAL_ID}>
                        <Switch fallback={<span class="text-center text-black dark:text-white">Loading...</span>}>
                          <Match when={!isLoggedIn()}>
                            <STEP_LOGIN />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[0]}>
                            <STEP_1_NAME />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[1]}>
                            <STEP_2_SELECT_TYPE />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[2]}>
                            <STEP_3_MEMBERS />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[3]}>
                            <STEP_4_VOTE_THRESHOLD />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[4]}>
                            <STEP_5_CONFIRM />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[5]}>
                            <STEP_6_SUCCESS />
                          </Match>
                        </Switch>
                      </Show>
                      <Show when={multisigModalType() === ADD_MEMBER_MODAL_ID}>
                        <Switch fallback={<span class="text-center text-black dark:text-white">Loading...</span>}>
                          <Match when={!isLoggedIn()}>
                            <STEP_LOGIN />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[2]}>
                            <STEP_3_MEMBERS />
                          </Match>
                          <Match when={getCurrentStep() === MULTISIG_CRUMB_TRAIL[4]}>
                            <STEP_5_CONFIRM />
                          </Match>
                        </Switch>
                      </Show>
                    </div>
                  </div>
                </div>
              </div>
              <Show when={(multisigModalType() === MULTISIG_MODAL_ID && getCurrentStep() !== accessibleSteps()[5]) || multisigModalType() === ADD_MEMBER_MODAL_ID}>
                <div class={`flex ${ lessThan1200() ? 'flex-col' : 'flex-row' } items-center justify-between bg-gray-200 dark:bg-gray-900 rounded-b-lg`}>
                  <div class={`text-xs dark:text-white text-black text-center mx-auto px-3 ${ lessThan1200() ? 'py-3' : '' }`}>{textHint()}</div>
                  <div class={`flex flex-row ${ lessThan1200() ? 'w-full' : '' }`}>
                    <button disabled={finishing()} type="button" class={`text-sm text-white p-3 bg-saturn-purple opacity-100 hover:bg-purple-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none text-center border-r border-r-[1px] dark:border-r-gray-900 border-r-gray-200 ${ !lessThan1200() ? '' : 'rounded-bl-lg' } flex-grow`} onClick={goBack}><span class="px-2 flex">&lt; <span class="ml-2">{getCurrentStep() === accessibleSteps()[0] ? 'Close' : 'Back'}</span></span></button>
                    <button disabled={disableCrumbs().includes(getNextStep() ?? "") || notEnoughBalance() || finishing()} type="button" class={`text-sm text-white p-3 bg-saturn-purple opacity-100 hover:bg-purple-600 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-br-lg text-center flex-grow`} onClick={!inReviewStep() ? goForward : multisigModalType() === MULTISIG_MODAL_ID ? createMultisig : proposeNewMembers}>{finishing() ? <span class="px-2 flex justify-end"><LoaderAnimation text="Processing" /></span> : inReviewStep() ? <span class="px-3 flex justify-end">Finish <img src={FlagIcon} alt="Submit" width={13} height={13} class="ml-3" /></span> : <span class="px-2 flex justify-end"><span class="mr-2">Next</span> &gt;</span>}</button>
                  </div>
                </div>
              </Show>
            </SaturnCard>
          </Show>
        </div>
      </div>
    </>
  );
};

CreateMultisig.displayName = "CreateMultisig";
export default CreateMultisig;