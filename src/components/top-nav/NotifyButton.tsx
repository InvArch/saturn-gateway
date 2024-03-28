import NotificationIcon from '../../assets/icons/notification-icon-15x17.svg';
import { BUTTON_COMMON_STYLE } from '../../utils/consts';

const NotifyButton = () => {
  function handleClick() {
    console.log('Notify clicked');
  }

  return <div><button type="button" onClick={handleClick} class={`${ BUTTON_COMMON_STYLE } p-3 text-xs hover:opacity-75 w-10 h-10 focus:outline-none`}><img src={NotificationIcon} width={12} height={12} alt="notification-icon" class='mx-auto text-center' /><span class="sr-only">Notifications</span></button></div>;
};
NotifyButton.displayName = 'NotifyButton';
export default NotifyButton;