import { Show, createMemo, createSignal, lazy } from "solid-js";
import ConnectWallet from "./ConnectWallet";
import SaturnLogo from "./SaturnLogo";
import SubNavbar from "./SubNavbar";
import { useLocation } from "@solidjs/router";

const Navbar = (props: any) => {
  const [open, setOpen] = createSignal(false);
  const loc = useLocation();

  const atHome = createMemo(() => loc.pathname === '/');
  const lessThanSm = createMemo(() => window.matchMedia('(max-width: 414px)').matches);
  const lessThanLg = createMemo(() => window.matchMedia('(max-width: 992px)').matches);

  return <>
    <nav {...props} class={`${ atHome() ? 'bg-transparent backdrop-blur' : 'bg-saturn-offwhite dark:bg-saturn-black' } sticky z-50 top-0 left-0`}>
      <div class="py-3 px-5">
        <div class={`flex items-center ${ atHome() ? 'justify-center' : 'justify-between' }`}>
          <div class={`${ open() && lessThanSm() ? 'invisible' : '' }`}>
            <SaturnLogo />
          </div>
          <Show when={!atHome()}>
            {/* <MobileMenu> */}
            <div class="flex flex-row items-center gap-2 z-1">
              {/* <NotifyButton /> */}
              {/* <ChangeNetworkButton /> */}
              <ConnectWallet isOpen={(open) => setOpen(open)} inMultisig={false} />
            </div>
            {/* </MobileMenu> */}
          </Show>
        </div>
      </div>
      <Show when={!atHome() && lessThanLg()}>
        <SubNavbar />
      </Show>
    </nav>
  </>;
};

Navbar.displayName = 'Navbar';
export default Navbar;
