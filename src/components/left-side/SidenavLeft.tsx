import LeftContent from "./LeftContent";

const SidenavLeft = () => {
  return <aside class="fixed top-0 left-0 z-40 w-72 h-full mt-36 md:mt-20" aria-label="static-sidebar-left">
    <LeftContent inDrawer={false} />
  </aside>;
};

SidenavLeft.displayName = "SidenavLeft";
export default SidenavLeft;
