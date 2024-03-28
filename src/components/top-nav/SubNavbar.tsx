import DrawerLeft from "../left-side/DrawerLeft";
import DrawerRight from "../right-side/DrawerRight";
import CaretLeftIcon from "../../assets/icons/caret-left-icon.svg";
import CaretRightIcon from "../../assets/icons/caret-right-icon.svg";
import { Show, createMemo } from "solid-js";
import { useLocation } from "@solidjs/router";

const SubNavbar = (props: any) => {
  const loc = useLocation();

  const showRightSide = createMemo(() => {
    return loc.pathname !== '/' && !loc.pathname.endsWith('create') && !loc.pathname.endsWith('settings');
  });

  return <div>
    <nav {...props} class="bg-saturn-purple py-1.5 sticky w-full h-10 z-40 top-0 left-0 flex justify-between lg:hidden">

      {/* Pops up the left sidenav */}
      <button
        aria-controls="leftSidebar"
        type="button"
        data-drawer-target="leftSidebar"
        data-drawer-placement="left"
        data-drawer-toggle="leftSidebar"
        class="inline-flex items-center justify-start px-3 mx-3 text-sm text-gray-500 rounded-lg hover:bg-purple-800 focus:outline-none">
        <img src={CaretLeftIcon} alt="left-sidebar-menu-icon" width={20} height={20} class="w-2 h-2" />
        <span>{' '}</span>
        <span class="text-white ml-3">Main Menu</span>
      </button>

      <button
        aria-controls="rightSidebar"
        type="button"
        data-drawer-target="rightSidebar"
        data-drawer-placement="right"
        data-drawer-toggle="rightSidebar"
        class={`inline-flex items-center justify-end px-3 mx-3 text-sm text-gray-500 rounded-lg hover:bg-purple-800 focus:outline-none ${ showRightSide() ? '' : 'invisible' }`}>
        <span class="text-white mr-3">Context Menu</span>
        <span>{' '}</span>
        <img src={CaretRightIcon} alt="right-sidebar-menu-icon" width={20} height={20} class="w-2 h-2" />
      </button>
    </nav>

    {/* Left/Right drawers placed here to avoid z-index issues */}
    <DrawerLeft />
    <DrawerRight />
  </div>;
};

SubNavbar.displayName = 'SubNavbar';
export default SubNavbar;