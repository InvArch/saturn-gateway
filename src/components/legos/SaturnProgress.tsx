interface ISaturnProgressProps {
  total: number;
  percentage: number;
  color: string;
  label: string;
  overridePercentage?: any;
}

const SaturnProgress = (props: ISaturnProgressProps) => {
  return <div class="flex flex-col w-full">
    <div class="flex justify-between mb-1">
      <span class="text-xs font-medium text-saturn-lightgrey dark:text-saturn-offwhite">{props.label} ({props.total})</span>
      {!props.overridePercentage ? <span class="text-xs text-black dark:text-white">{`${ props.percentage }%`}</span> : props.overridePercentage}
    </div>
    <div class="border border-[1.5px] border-gray-200 dark:border-gray-700 rounded-full h-3 dark:border-gray-700">
      <div class={`${ props.color } h-2.5 rounded-full`} style={{ width: `${ props.percentage }%` }}></div>
    </div>
  </div>;
};

SaturnProgress.displayName = "SaturnProgress";
export default SaturnProgress;