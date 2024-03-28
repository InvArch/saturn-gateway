import MobileMenuButton from "./MobileMenuButton";

const MobileMenu = (props: { children: any; }) => {
  return <>
    <div>
      <MobileMenuButton />
    </div>
    {props.children}
  </>;
};

MobileMenu.displayName = 'MobileMenu';
export default MobileMenu;
