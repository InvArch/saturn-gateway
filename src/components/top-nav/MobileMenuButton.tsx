import { BUTTON_COMMON_STYLE } from "../../utils/consts";
import MenuIcon from "../../assets/icons/menu-icon.svg";


const MobileMenuButton = () => {
  return <div>
    <button type="button" onClick={() => null} class={`${ BUTTON_COMMON_STYLE } p-3 text-xs hover:opacity-75 w-10 h-10 focus:outline-none`}><img src={MenuIcon} width={12} height={12} alt="notification-icon" class='mx-auto text-center' /><span class="sr-only">Mobile Menu</span></button>
  </div>;
};

MobileMenuButton.displayName = 'MobileMenuButton';
export default MobileMenuButton;
