import { Routes, Route, useLocation } from "@solidjs/router";
import Management from "../../pages/Management";
import Transactions from "../../pages/Transactions";
import Assets from "../../pages/Assets";
import { createMemo, createEffect } from "solid-js";
import SaturnCard from "../legos/SaturnCard";
import { useSaturnContext } from "../../providers/saturnProvider";
import { PagesEnum } from "../../pages/pages";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import Welcome from "../../pages/Welcome";

const MainContent = () => {
  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();

  const currentPathname = createMemo(() => loc.pathname);
  const isLoggedIn = createMemo(() => !!selectedAccountContext.state.account?.address);
  const hasMultisigs = createMemo(() => saturnContext.state.multisigItems ? saturnContext.state.multisigItems.length > 0 : false);

  const pageTitle = () => {
    if (!isLoggedIn() || !hasMultisigs()) return '';
    if (currentPathname().endsWith(`/${ PagesEnum.ASSETS }`)) {
      return 'Assets';
    } else if (currentPathname().endsWith(`/${ PagesEnum.TRANSACTIONS }`)) {
      return 'Transactions';
    } else if (currentPathname().endsWith(`/${ PagesEnum.MANAGEMENT }`)) {
      return ''; // Handle page title from Management.tsx
    } else {
      return 'Page not found!';
    }
  };

  return <SaturnCard header={pageTitle()}>
    <Routes>
      <Route
        path={PagesEnum.ASSETS}
        element={isLoggedIn() && hasMultisigs() ? <Assets /> : <Welcome />}
      />
      <Route
        path={PagesEnum.TRANSACTIONS}
        element={isLoggedIn() && hasMultisigs() ? <Transactions /> : <Welcome />}
      />
      <Route
        path={PagesEnum.MANAGEMENT}
        element={isLoggedIn() && hasMultisigs() ? <Management /> : <Welcome />}
      />
    </Routes>
  </SaturnCard>;
};

MainContent.displayName = 'MainContent';
export default MainContent;