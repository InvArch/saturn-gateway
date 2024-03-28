import { useLocation } from "@solidjs/router";
import { Match, Show, Switch, createMemo } from "solid-js";
import AssetsContext from "./AssetsContext";
import TransactionsContext from "./TransactionsContext";
import ManagementContext from "./ManagementContext";
import { PagesEnum } from "../../pages/pages";

const RightContent = (props: { inDrawer: boolean; }) => {
  const loc = useLocation();

  const currentPage = createMemo(() => loc.pathname);

  return <div class="h-full px-5 py-2 overflow-y-auto bg-saturn-offwhite dark:bg-saturn-black">
    <Show when={props.inDrawer}>
      <span id="inDrawer" />
    </Show>
    <div class="grid grid-cols-1 gap-12 text-black dark:text-white">
      {/* <Switch fallback="No data."> */}
      <Switch>
        <Match when={currentPage().endsWith(`/${ PagesEnum.ASSETS }`)}>
          <AssetsContext />
        </Match>
        <Match when={currentPage().endsWith(`/${ PagesEnum.TRANSACTIONS }`)}>
          <TransactionsContext />
        </Match>
        <Match when={currentPage().endsWith(`/${ PagesEnum.MANAGEMENT }`)}>
          <ManagementContext />
        </Match>
      </Switch>
    </div>
  </div>;
};

RightContent.displayName = "RightContent";
export default RightContent;