import DrawerLeft from "../left-side/DrawerLeft";
import DrawerRight from "../right-side/DrawerRight";

const SubNavbar = ({ ...props }) => {
  return <div>
    <nav {...props} class="bg-saturn-purple sticky w-full h-12 z-48 top-0 left-0 flex justify-around p-3 lg:hidden">
      {/* Pops up the left sidenav */}
      <button
        aria-controls="leftSidebar"
        type="button"
        data-drawer-target="leftSidebar"
        data-drawer-placement="left"
        data-drawer-show="leftSidebar"
        data-drawer-hide="rightSidebar"
        class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-purple-800 focus:outline-none">
        <span class="text-white">Left side</span>
      </button>

      {/* Pops up the right sidenav */}
      <button
        aria-controls="rightSidebar"
        type="button"
        data-drawer-target="rightSidebar"
        data-drawer-placement="right"
        data-drawer-show="rightSidebar"
        data-drawer-hide="leftSidebar"
        class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-purple-800 focus:outline-none">
        <span class="text-white">Right side</span>
      </button>
    </nav>

    {/* Left/Right drawers placed here to avoid z-index issues */}
    <DrawerLeft />
    <DrawerRight />
  </div>;
};
SubNavbar.displayName = 'SubNavbar';
export default SubNavbar;