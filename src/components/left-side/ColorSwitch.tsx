import { createEffect, createMemo, createSignal, onMount } from "solid-js";
import { useThemeContext } from "../../providers/themeProvider";

export enum ColorModeEnum {
  LIGHT = 'light',
  DARK = 'dark',
}

const ColorSwitch = () => {
  const [colorTheme, setColorTheme] = createSignal<ColorModeEnum>(ColorModeEnum.DARK);

  const theme = useThemeContext();
  const lsColorMode = theme.getColorMode();

  const modeText = createMemo(() => colorTheme() === ColorModeEnum.LIGHT ? 'Light' : 'Dark');

  function toggle() {
    // if set via local storage previously
    if (colorTheme()) {
      if (colorTheme() === ColorModeEnum.LIGHT) {
        document.documentElement.classList.add(ColorModeEnum.DARK);
        theme.setMode(ColorModeEnum.DARK);
        setColorTheme(ColorModeEnum.DARK);
      } else {
        document.documentElement.classList.remove(ColorModeEnum.DARK);
        theme.setMode(ColorModeEnum.LIGHT);
        setColorTheme(ColorModeEnum.LIGHT);
      }
    }
  };

  onMount(() => {
    if (lsColorMode !== null) {
      // if mode set via local storage previously
      if (lsColorMode === ColorModeEnum.LIGHT) {
        document.documentElement.classList.remove(ColorModeEnum.DARK);
      } else {
        document.documentElement.classList.add(ColorModeEnum.DARK);
      }
      theme.setMode(lsColorMode as ColorModeEnum);
      setColorTheme(lsColorMode as ColorModeEnum);
    } else {
      // default to dark mode if no local storage mode set
      document.documentElement.classList.add(ColorModeEnum.DARK);
      theme.setMode(ColorModeEnum.DARK);
      setColorTheme(ColorModeEnum.DARK);
    }
  });

  return <div class="mt-4 invisible absolute top-1/2">
    <label for="colorToggle" class="relative inline-flex items-center mr-5 cursor-pointer">
      <input id="colorToggle" type="checkbox" name="colorToggle" value={colorTheme()} onInput={toggle} checked={colorTheme() === ColorModeEnum.DARK} class="sr-only peer theme-color-toggle" />
      <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-purple-100 dark:peer-focus:ring-purple-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600" />
      <span class="ml-3 text-sm font-medium text-saturn-lightgrey dark:text-saturn-lightgrey">{modeText()}</span>
    </label>
  </div>;
};

ColorSwitch.displayName = 'ColorSwitch';
export default ColorSwitch;