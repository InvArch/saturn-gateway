import { PagesEnum, pages } from "../../pages/pages";
import { A, useLocation } from "@solidjs/router";
import { For, JSXElement, createMemo } from "solid-js";
import { AssetsIcon } from '../../components/svg-icons/AssetsIcon';
import { TransactionsIcon } from '../../components/svg-icons/TransactionsIcon';
import { MembersIcon } from '../../components/svg-icons/MembersIcon';
import { SettingsIcon } from '../../components/svg-icons/SettingsIcon';
import styles from '../../App.module.css';
import { BUTTON_COMMON_STYLE } from "../../utils/consts";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";

function matchIconToPage(page: string): JSXElement {
  // Assign the correct icon component to each page link
  switch (page) {
    case PagesEnum.ASSETS:
      return <AssetsIcon />;
    case PagesEnum.TRANSACTIONS:
      return <TransactionsIcon />;
    case PagesEnum.MANAGEMENT:
      return <MembersIcon />;
    case PagesEnum.SETTINGS:
      return <SettingsIcon />;
    default:
      return null;
  }
}

const PageLinks = () => {
  const saContext = useSelectedAccountContext();
  const loc = useLocation();

  const isLoggedIn = createMemo(() => !!saContext.state.account?.address);
  const multisigId = createMemo(() => loc.pathname.split('/')[1]);

  function navTo(page: string): string {
    return `/${ multisigId() }/${ page }`;
  }

  function simulateButtonClick() {
    const button = document.querySelector('button[data-drawer-hide="leftSidebar"][aria-controls="leftSidebar"]');
    if (button instanceof HTMLButtonElement) {
      button.click();
    }
  }

  return <div class={`${ !isLoggedIn() || !multisigId() ? '' : styles.pageListContainer } mb-5 mt-3`}>
    <h5 class="text-sm mb-2 text-black dark:text-saturn-offwhite">Menu</h5>
    <For each={pages}>
      {(page) => {
        return (
          <A
            href={navTo(page)}
            class={`${ styles.pageItemContainer }`}
            activeClass={`${ styles.enabled } ${ BUTTON_COMMON_STYLE }`}
            onClick={() => simulateButtonClick()}
          // data-drawer-hide={mutateButton() ? 'leftSidebar' : undefined}
          // aria-controls={mutateButton() ? 'leftSidebar' : undefined}
          >
            {/* <div class={styles.selectedItemGradient} /> */}
            <div class={styles.selectedItemIndicator} />
            {matchIconToPage(page)}
            <span class="ml-4 text-saturn-black dark:text-saturn-offwhite">{page}</span>
          </A>
        );
      }}
    </For>
  </div>;
};

PageLinks.displayName = 'PageLinks';
export default PageLinks;
