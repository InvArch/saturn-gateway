import { JSX, JSXElement, children, createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js';
import { INPUT_COMMON_STYLE, INPUT_CREATE_MULTISIG_STYLE } from '../../utils/consts';

interface SaturnTextFieldType extends JSX.HTMLAttributes<HTMLInputElement | MouseEvent> {
  initialValue?: string;
  currentValue?: (currentValue: string) => void;
  disabled?: boolean;
  min: number;
  max: number;
  label: string;
  isMultisigUi?: boolean;
};

const MATH_STYLE = 'text-saturn-purple text-lg p-1 rounded-md focus:outline-none grow dark:text-white opacity-50 hover:opacity-100';

const SaturnNumberInput = (props: SaturnTextFieldType) => {
  const [text, setText] = createSignal<string>(props.initialValue || '');

  function preventNonNumberInput(value: string): boolean {
    return /^\d+$/.test(value) || value === '';
  }

  function enforceMinMaxBounds(value: string): string {
    const currentValue = parseInt(value);

    if (props.min && currentValue < props.min) {
      return props.min.toString();
    } else if (props.max && currentValue > props.max) {
      return props.max.toString();
    }

    return value;
  }

  function handleBlur(event: FocusEvent) {
    const value = (event.target as HTMLInputElement).value;
    const cleanValue = enforceMinMaxBounds(value);

    setText(cleanValue);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.key !== 'Backspace' && !preventNonNumberInput(e.key))) {
      e.preventDefault();
      return;
    }
  }

  function handleInput(e: InputEvent) {
    const value = (e.target as HTMLInputElement).value;

    if (value === '' && props.currentValue) {
      setText(props.initialValue || '0');
      props.currentValue(props.initialValue || '0');
    }

    if (preventNonNumberInput(value) && props.currentValue) {
      setText(value);

      let input = enforceMinMaxBounds(text());
      if (props.max && parseInt(input) > props.max) {
        input = props.max.toString();
        setText(input);
      }

      props.currentValue(input);
    }
  }

  function decrement() {
    const amount = text();
    const currentValue = parseInt(amount);

    if (currentValue > 0 && props.currentValue) {
      const newValue = currentValue - 1;
      if (props.min && newValue < props.min) return;
      setText(`${ newValue }`);
      props.currentValue(`${ newValue }`);
    }

    return;
  }

  function increment() {
    const amount = text();
    const currentValue = parseInt(amount);

    if (props.currentValue) {
      const newValue = currentValue + 1;
      if (props.max && newValue > props.max) return;
      setText(`${ newValue }`);
      props.currentValue(`${ newValue }`);
    }

    return;
  }

  createEffect(on(() => props.initialValue, () => {
    setText(props.initialValue || '');
  }));

  createEffect(on(text, () => {
    if (text() === '') {
      setText(props.min?.toString() || '0');
    }
  }));

  return <div class="flex flex-row gap-1 items-center">
    <button disabled={props.disabled} type="button" class={`${ MATH_STYLE } ${ props.disabled ? 'invisible' : '' }`} onClick={decrement}>-</button>
    <input id={props.label} name={props.label} class={`${ !props.isMultisigUi ? INPUT_COMMON_STYLE : INPUT_CREATE_MULTISIG_STYLE } text-center w-11 h-10 p-2 dark:focus:text-saturn-purple focus:text-saturn-purple`} type="text" value={text()} onKeyDown={handleKeyDown} onBlur={handleBlur} onMouseLeave={handleBlur} onInput={handleInput} disabled={props.disabled} min={props.min?.toString()} max={props.max?.toString()} />
    <button disabled={props.disabled} type="button" class={`${ MATH_STYLE } ${ props.disabled ? 'invisible' : '' }`} onClick={increment}>+</button>
  </div>;
};

SaturnNumberInput.displayName = 'SaturnNumberInput';
export default SaturnNumberInput;