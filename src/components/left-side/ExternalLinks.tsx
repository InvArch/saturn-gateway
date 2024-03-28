import ExternalLinkIcon from '../../assets/icons/external-link-icon-16x16.svg';
import { For } from 'solid-js';

const links: [string, string][] = [
  ["Docs", "https://saturn-docs.invarch.network/"],
  ["Support", "#"],
  ["𝕏", "#"],
  ["Discord", "#"]
];

function renderExternalLink(name: string, href: string) {
  return <li class="text-saturn-lightgrey hover:text-saturn-yellow">
    <a href={href} rel='noreferrer' target='_blank' class="flex items-center py-1.5 rounded-md">
      <span class="mr-1">{name}</span>
      <img src={ExternalLinkIcon} width={12} height={12} alt="external-link-icon" />
    </a>
  </li>;
}

const ExternalLinks = () => {
  return <ul class="text-xs flex flex-row gap-5 items-center">
    <For each={links}>
      {(link) => renderExternalLink(link[0], link[1])}
    </For>
  </ul>;
};

ExternalLinks.displayName = "ExternalLinks";
export default ExternalLinks;