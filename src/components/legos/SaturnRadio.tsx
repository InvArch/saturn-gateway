import { For } from "solid-js";
import { MultisigEnum } from "../../utils/consts";

interface ISaturnRadioProps {
  options: MultisigEnum[];
  selected: MultisigEnum;
  setSelected: (selected: MultisigEnum) => void;
  direction?: "row" | "column";
}

const SaturnRadio = (props: ISaturnRadioProps) => {
  function handleRadioClick(option: MultisigEnum) {
    props.setSelected(option);
  }

  return (
    <div class={`w-full flex gap-5 items-center mb-2 ${ props.direction === 'row' ? 'flex-row' : 'flex-col' }`}>
      <For each={props.options}>
        {(option, index) => (
          <div>
            <input checked={props.selected === option} id={`radio-option-${ index() }`} type="radio" value={option} name={`radio-option-${ index() }`} class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" onClick={[handleRadioClick, option]} />
            <label for={`radio-option-${ index() }`} class="ml-2 text-xs font-medium text-gray-900 dark:text-gray-300">{option}</label>
          </div>
        )}
      </For>
    </div>
  );
};

SaturnRadio.displayName = "SaturnRadio";
export default SaturnRadio;