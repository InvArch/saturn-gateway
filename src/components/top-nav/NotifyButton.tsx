import NotificationIcon from '../../assets/icons/notification-icon-15x17.svg';
import { BUTTON_COMMON_STYLE } from '../../utils/consts';

const NotifyButton = () => {
  function handleClick() {
    console.log('Notify clicked');
  }

  return <button type="button" onClick={handleClick} class={`${ BUTTON_COMMON_STYLE } p-3 text-xs hover:opacity-75 w-10 h-10 focus:outline-none`}><img src={NotificationIcon} width={10} height={12} alt="notification-icon" /><span class="sr-only">Notifications</span></button>;
};
NotifyButton.displayName = 'NotifyButton';
export default NotifyButton;