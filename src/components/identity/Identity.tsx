import { Show, Suspense, createMemo, createResource, lazy } from 'solid-js';
import TalismanIdenticon from '../identity/TalismanIdenticon';
import { getBestIdentity, type AggregatedIdentity } from "../../utils/identityProcessor";
import { useIdentityContext } from "../../providers/identityProvider";
import { stringShorten } from '@polkadot/util';

const CopyAddress = lazy(() => import('../legos/CopyAddressField'));

export default function Identity(props: { address: string; }) {
  const idContext = useIdentityContext();

  const identity = createMemo(() => {
    return idContext.state.identities?.find(id => id.address === props.address);
  });

  const image = createMemo(() => identity()?.image?.value);
  const name = createMemo(() => identity()?.name);
  const address = createMemo(() => props.address);

  const openIdentityCard = () => {
    console.log('open identity card disabled');
    return;
    // const i: AggregatedIdentity = identity() || { address: getAddress(), otherIdentities: [] };
    // identityContext.setters.openModal(i);
  };

  return (
    <div onClick={openIdentityCard}>
      <Suspense fallback={
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <TalismanIdenticon value={address()} size={34} />
          <CopyAddress name={name()} address={address()} length={10} />
        </div>
      }>
        <div class="flex flex-row gap-2.5 items-center text-black dark:text-white">
          <Show
            when={image()}
            fallback={
              <TalismanIdenticon value={address()} size={34} />
            }
          >
            <img class="max-h-[34px] max-w-[34px] rounded-full"
              src={image()}
            />
          </Show>
          <CopyAddress name={name()} address={address()} length={10} />
        </div>
      </Suspense>
    </div>
  );
};
