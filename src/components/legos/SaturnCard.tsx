interface ISaturnCardProps {
  children: any,
  header?: string;
  overrideHeader?: any;
  noPadding?: boolean;
}
const SaturnCard = (props: ISaturnCardProps) => {
  return (
    <div class={`bg-white border border-gray-900 dark:bg-saturn-darkgrey ${ props.noPadding ? '' : 'p-5' } mb-5 rounded-lg h-fit flex flex-col self-stretch`}>
      {props.header || props.overrideHeader ? <h3 class="text-sm text-saturn-black dark:text-saturn-offwhite mb-3">{props.overrideHeader ? props.overrideHeader : props.header}</h3> : null}
      {props.children ? props.children : null}
    </div>
  );
};

SaturnCard.displayName = 'SaturnCard';
export default SaturnCard;