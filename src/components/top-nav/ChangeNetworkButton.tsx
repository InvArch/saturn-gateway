import { For, JSXElement, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import { NetworkEnum } from '../../utils/consts';
import { useProposeContext } from '../../providers/proposeProvider';
import SaturnSelectItem from '../legos/SaturnSelectItem';
import { getNetworkBlock } from '../../utils/getNetworkBlock';
import SaturnSelect from '../legos/SaturnSelect';
import { Dropdown, type DropdownInterface, type DropdownOptions, initDropdowns } from 'flowbite';
import { balances } from '@polkadot/types/interfaces/definitions';
import { Balances, getBalancesFromAllNetworks } from '../../utils/getBalances';
import { useSaturnContext } from '../../providers/saturnProvider';

const ChangeNetworkButton = () => {
  let dropdown: DropdownInterface;
  const [isDropdownActive, setIsDropdownActive] = createSignal(false);
  const [activeNetwork, setActiveNetwork] = createSignal<NetworkEnum>(NetworkEnum.KUSAMA);
  const [balances, setBalances] = createSignal<Array<[string, [string, Balances][]]>>([]);

  const TOGGLE_ID = 'networkToggle';
  const DROPDOWN_ID = 'networkDropdown';
  const $toggle = () => document.getElementById(TOGGLE_ID);
  const $dropdown = () => document.getElementById(DROPDOWN_ID);
  const networkOptions: DropdownOptions = {
    placement: 'bottom',
    triggerType: 'click',
    offsetSkidding: 0,
    offsetDistance: -7,
    delay: 300,
  };

  const proposeContext = useProposeContext();
  const saturnContext = useSaturnContext();

  const allTheNetworks = (): Record<string, JSXElement> => ({
    [NetworkEnum.KUSAMA]: getNetworkBlock(NetworkEnum.KUSAMA),
    [NetworkEnum.POLKADOT]: getNetworkBlock(NetworkEnum.POLKADOT),
  });

  const filteredNetworks = createMemo(() => {
    const availableNetworks = balances().map(([network, assets]) => network);
    const allNetworks = Object.entries(allTheNetworks());
    const filteredNetworks = allNetworks.filter(([name, element]) => availableNetworks.includes(name as NetworkEnum));
    return filteredNetworks;
  });

  function selectedNetwork() {
    const contextSelection = proposeContext.state.currentNetwork;
    return contextSelection && getNetworkBlock(contextSelection) || getNetworkBlock(activeNetwork());
  };

  function updateNetworkMode(name: NetworkEnum) {
    setActiveNetwork(name);
    proposeContext.setters.setCurrentNetwork(name);
    setIsDropdownActive(false);
    dropdown.hide();
  }

  function openDropdown(e: Event) {
    if (dropdown) {
      if (isDropdownActive()) {
        setIsDropdownActive(false);
        dropdown.hide();
      } else {
        setIsDropdownActive(true);
        dropdown.show();
      }
    }
  }

  onMount(() => {
    initDropdowns();
    dropdown = new Dropdown($dropdown(), $toggle(), networkOptions);
  });

  createEffect(on(() => saturnContext.state.multisigAddress, () => {
    // Setting all balances
    const id = saturnContext.state.multisigId;
    const address = saturnContext.state.multisigAddress;
    if (typeof id !== 'number' || !address) {
      console.log('no multisig id or address');
      return;
    }

    const runAsync = async () => {
      const nb = await getBalancesFromAllNetworks(address);
      const remapped = Object.entries(nb).map(([network, assets]) => {
        const ret: [string, [string, Balances][]] = [network,
          Object.entries(assets)
            .map(([asset, assetBalances]) => {
              const ret: [string, Balances] = [asset, assetBalances as Balances];

              return ret;
            })
            .filter(([_, assetBalances]) => assetBalances.freeBalance != '0'
              || assetBalances.reservedBalance != '0'
              || assetBalances.frozenBalance != '0')];

        return ret;
      });

      setBalances(remapped);
    };

    runAsync();
  }));

  createEffect(() => {
    const handleClickOutside = (event: any) => {
      const toggleElement = $toggle();
      const dropdownElement = $dropdown();

      if (toggleElement && dropdownElement && !toggleElement.contains(event.target) && !dropdownElement.contains(event.target)) {
        dropdown.hide();
        setIsDropdownActive(false);
      }
    };

    if (isDropdownActive()) {
      document.addEventListener('click', handleClickOutside);
    }

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  return <>
    <SaturnSelect disabled={true} isOpen={isDropdownActive()} isMini={false} currentSelection={selectedNetwork()} toggleId={TOGGLE_ID} dropdownId={DROPDOWN_ID} initialOption={getNetworkBlock(activeNetwork())} onClick={openDropdown}>
      <For each={filteredNetworks()}>
        {([name, element]) => <SaturnSelectItem onClick={() => updateNetworkMode(name as NetworkEnum)}>
          {element}
        </SaturnSelectItem>}
      </For>
    </SaturnSelect>
  </>;
};

ChangeNetworkButton.displayName = 'ChangeNetworkButton';
export default ChangeNetworkButton;