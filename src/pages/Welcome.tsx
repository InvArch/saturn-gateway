import { createEffect, createSignal, Switch, Match, onMount, on, onCleanup, createMemo } from "solid-js";
import ConnectWallet from "../components/top-nav/ConnectWallet";
import { useSaturnContext } from "../providers/saturnProvider";
import { useSelectedAccountContext } from "../providers/selectedAccountProvider";
import { useLocation } from "@solidjs/router";
import AddMultisigButton from "../components/left-side/AddMultisigButton";
import { useMegaModal } from "../providers/megaModalProvider";
import LoaderAnimation from "../components/legos/LoaderAnimation";
import { getMultisigsForAccount } from "../utils/getMultisigs";

const Welcome = () => {
  const modal = useMegaModal();
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();

  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [hasMultisigs, setHasMultisigs] = createSignal(false);
  const [isMultisigId, setIsMultisigId] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  createEffect(() => {
    setIsLoggedIn(!!selectedAccountContext.state.account?.address);
  });

  createEffect(() => {
    setIsLoading(true);
    async function checkMultisigsExist() {
      try {
        const sat = saturnContext.state.saturn;
        const address = selectedAccountContext.state.account?.address;

        if (!sat || !address) {
          setIsLoading(false);
          return;
        }

        const multisigs = await getMultisigsForAccount(address, sat.api);
        setHasMultisigs(multisigs.length > 0);
      } catch (error) {
        console.log("No multisigs available for this account");
        setHasMultisigs(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkMultisigsExist();
  });

  createEffect(() => {
    const idOrAddress = loc.pathname.split('/')[1];
    const isDefined = idOrAddress !== 'undefined';
    setIsMultisigId(isDefined);
  });

  createEffect(() => {
    if (!isLoading() && isLoggedIn() && hasMultisigs() && modal) {
      modal.showMultisigListModal();
    } else {
      modal.hideMultisigListModal();
    }
  });

  return (
    <Switch>
      <Match when={isLoading()}>
        <div class="flex justify-center items-center h-full">
          <LoaderAnimation text="Loading..." />
        </div>
      </Match>
      <Match when={isLoggedIn() && !hasMultisigs()}>
        <div class="text-xs mx-auto text-center">
          <h2 class="text-lg font-bold">Welcome aboard.</h2>
          <p class="mt-1 mb-2">You will first need to create a new multisig to get started.</p>
          <AddMultisigButton isInModal={false} />
        </div>
      </Match>
      <Match when={!isLoggedIn()}>
        <div class="text-xs mx-auto text-center">
          <h2 class="text-lg font-bold">Welcome to Omniway.</h2>
          <p class="mt-1">To get started, please connect your wallet.</p>
          <ConnectWallet inMultisig={true} />
        </div>
      </Match>
    </Switch>
  );
};

Welcome.displayName = 'Welcome';
export default Welcome;