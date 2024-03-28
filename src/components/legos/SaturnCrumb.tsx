import { For, createEffect, createMemo } from "solid-js";
import { CRUMB_STYLE } from "../../utils/consts";

interface SaturnCrumbProps {
  trail: string[];
  active: string;
  trailWidth: string;
  disabledCrumbs?: string[];
  setActive: (crumb: string) => void;
}

const SaturnCrumb = (props: SaturnCrumbProps) => {
  const filteredTrail = createMemo(() => props.trail.filter(crumb => crumb !== 'success'));
  const disabledCrumbs = createMemo(() => props.disabledCrumbs || []);

  function scrollCrumb(crumb: string) {
    const activeCrumbElement = document.getElementById(crumb);
    if (activeCrumbElement) {
      activeCrumbElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }

  function handleCrumbClick(crumb: string) {
    scrollCrumb(crumb);
    props.setActive(crumb);
  }

  createEffect(() => {
    scrollCrumb(props.active);
  });

  return (
    <nav class="py-3 inline-flex w-full justify-center" aria-label="Breadcrumb">
      <ol id="breadcrumb" class={`overflow-x-scroll overflow-y-hidden inline-flex ${ props.trailWidth } scrollbar-hide gap-2 justify-start`}>
        <For each={filteredTrail()}>
          {(crumb, index) => (
            <li aria-disabled={disabledCrumbs().includes(crumb)} id={crumb} class={`relative inline-flex items-center crumb-li w-full ${ props.active === crumb ? 'justify-center' : '' }`}>
              <span class={`relative z-10 crumb-index border-[1.5px] ${ props.active === crumb ? 'bg-white text-saturn-purple border-saturn-purple' : disabledCrumbs().includes(crumb) ? 'bg-gray-200 border-gray-200 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-600' : 'bg-saturn-purple border-saturn-purple' } rounded-full text-[6px] text-center left-2 pt-[1px] p-1 h-[12.5px]`}>
                {index() + 1}
              </span>
              <button
                disabled={disabledCrumbs().includes(crumb)}
                type="button"
                class={`w-52 ${ CRUMB_STYLE } ${ props.active === crumb ? 'bg-gray-200 dark:bg-purple-900 dark:text-saturn-offwhite dark:hover:text-purple-300 text-saturn-lightgrey hover:text-saturn-purple dark:hover:bg-purple-950 hover:bg-purple-300 border border-purple-500 hover:border-purple-700' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-100 dark:text-gray-500 dark:hover:text-gray-400 bg-gray-100 dark:bg-gray-900 dark:hover:bg-saturn-darkpurple border border-gray-800 dark:hover:border-gray-800' }`}
                onClick={() => handleCrumbClick(crumb)}
              >
                {crumb}
              </button>
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
};

SaturnCrumb.displayName = "SaturnCrumb";
export default SaturnCrumb;