import { createMemo } from "solid-js";

type HistoryRowProps = {
  timestamp: string;
  color: 'red' | 'green';
  user?: string;
  activity: [string, string];
};

// parse out the date and time out of a timestamp
function parseDateTime(timestamp: string | Date): string[] {
  let parsedTimestamp: number;

  if (typeof timestamp === 'string') {
    parsedTimestamp = parseInt(timestamp);
    if (isNaN(parsedTimestamp)) {
      throw new Error('Invalid timestamp');
    }
  } else if (timestamp instanceof Date) {
    parsedTimestamp = timestamp.getTime();
  } else {
    throw new Error('Invalid timestamp type');
  }

  const date = new Date(parsedTimestamp);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

  return [time, `${ month } ${ day }, ${ year }`];
}

const HistoryRow = (props: HistoryRowProps) => {
  const [time, date] = createMemo<string[]>(() => parseDateTime(props.timestamp))();
  return <div class="flex flex-col lg:w-[273.65px] border-b border-px dark:border-gray-800 border-gray-200 pb-3 mb-3">
    <div class="text-saturn-lightgrey text-xs w-full">

      {/* Time */}
      <div class="text-saturn-lightgrey mb-2">
        <span>{time}</span>
        <span class="float-right">{date}</span>
      </div>

      {/* User */}
      {!props.user ? null : <div class="mb-2 text-saturn-lightgrey">
        <span class="text-xxs">user</span>
        <span class="float-right text-black dark:text-white text-xxs">{props.user}</span>
      </div>}

      {/* Activity */}
      <div class="text-saturn-lightgrey mb-2">
        <span class={`${ props.color === 'green' ? 'text-black bg-saturn-green' : 'text-white bg-saturn-red' } text-xxs rounded-sm px-2 py-1`}>
          {props.activity[0]}
        </span>
        <span class="float-right text-xxs text-black dark:text-white">
          {props.activity[1]}
        </span>
      </div>

    </div>
  </div>;
};

HistoryRow.displayName = 'HistoryRow';
export default HistoryRow;
