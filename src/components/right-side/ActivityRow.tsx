type ActivityRowProps = {
  timestamp: string;
  aye: boolean;
  activity: string;
};

const ActivityRow = (props: ActivityRowProps) => {
  return <div class="flex flex-col lg:w-[273.65px] border-b border-px dark:border-gray-700 border-gray-200 pb-3 mb-3">
    <div class="flex flex-row mb-1">
      <div class="text-saturn-lightgrey text-xxs flex flex-row justify-between w-full">
        <span>{props.timestamp}</span>
        <span class="float-right">
          <span>Voted</span>
          <span class={`p-1 ml-[5px] rounded ${ props.aye ? 'bg-saturn-green text-black' : 'bg-saturn-red text-white' }`}>
            {props.aye ? 'Aye' : 'Nay'}
          </span>
        </span>
      </div>
    </div>
    <span class="text-xs text-black dark:text-white">Executed {props.activity} call</span>
  </div>;
};

ActivityRow.displayName = 'ActivityRow';
export default ActivityRow;
