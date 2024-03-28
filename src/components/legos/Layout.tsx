import Navbar from "../top-nav/Navbar";
import SidenavLeft from "../left-side/SidenavLeft";
import SidenavRight from "../right-side/SidenavRight";
import { useLocation } from "@solidjs/router";
import { Show, createMemo } from "solid-js";
import CryptoAccounts from "../modals/CryptoAccounts";
import ProposeModal from "../modals/ProposeModal";
import { Portal } from "solid-js/web";
import CreateMultisig, { MULTISIG_CRUMB_TRAIL } from "../modals/CreateMultisig";
import MultisigListModal from "../modals/MultisigListModal";
import FeeAssetModal from "../modals/FeeAssetModal";

const Layout = ({ children }: { children: any; }) => {
  const loc = useLocation();

  const showRightSide = createMemo(() => {
    return loc.pathname !== '/' && !loc.pathname.endsWith('create') && !loc.pathname.endsWith('settings');
  });
  const atHome = createMemo(() => {
    return loc.pathname === '/';
  });

  return <div>
    {/* Portal elements */}
    <Portal mount={document.getElementById('accountsWindow') || undefined}>
      <CryptoAccounts />
    </Portal>
    <Portal mount={document.getElementById('proposeWindow') || undefined}>
      <ProposeModal />
    </Portal>
    <Portal mount={document.getElementById('createMultisigWindow') || undefined}>
      <CreateMultisig />
    </Portal>
    <Portal mount={document.getElementById('multisigListWindow') || undefined}>
      <MultisigListModal />
    </Portal>
    <Portal mount={document.getElementById('feeAssetWindow') || undefined}>
      <FeeAssetModal />
    </Portal>
    <Portal mount={document.getElementById('addMemberWindow') || undefined}>
      <CreateMultisig limitSteps={[MULTISIG_CRUMB_TRAIL[2], MULTISIG_CRUMB_TRAIL[4]]} />
    </Portal>

    {/* Top nav */}
    <Navbar />

    <div>
      {/* Left side */}
      <Show when={!atHome()}>
        <div class="hidden lg:block">
          <SidenavLeft />
        </div>
      </Show>

      {/* Main content */}
      <div class={`lg:w-auto ${ atHome() ? '' : 'lg:ml-[288px] lg:mr-[353px]' }`}>
        {children}
      </div>

      {/* Right side */}
      <Show when={showRightSide() && !atHome()}>
        <div class="hidden lg:block">
          <SidenavRight />
        </div>
      </Show>
    </div>
  </div>;
};

Layout.displayName = "Layout";
export default Layout;