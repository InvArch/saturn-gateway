import RightContent from "./RightContent";

const SidenavRight = () => {
  return <aside class="fixed top-0 right-0 z-40 w-auto h-screen md:mt-20" aria-label="static-sidebar-right">
    <RightContent inDrawer={false} />
  </aside>;
};

SidenavRight.displayName = 'SidenavRight';
export default SidenavRight;