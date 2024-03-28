import { batch, createContext, createEffect, createMemo, createRenderEffect, onMount, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { createLocalStorage } from "@solid-primitives/storage";
import { ColorModeEnum } from "../components/left-side/ColorSwitch";

type ThemeContextType = {
  colorMode: ColorModeEnum | null,
  setMode: (colorMode: ColorModeEnum) => void,
  getColorMode: () => string | null,
};

const defaultThemeState = (): ThemeContextType => ({
  colorMode: ColorModeEnum.DARK, // default to dark mode
  setMode: () => {
    return;
  },
  getColorMode: () => {
    return null;
  }
});

export const ThemeContext = createContext<ThemeContextType>(defaultThemeState());

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext: cannot find a ThemeContext");
  }

  return context;
}

export function ThemeProvider(props: any) {
  const [state, setState] = createStore<ThemeContextType>(defaultThemeState());
  const [storageState, setStorageState] = createLocalStorage();

  function getColorMode(): string | null {
    try {
      const data = JSON.parse(storageState['colorMode']);
      if (!data) return null;
      return data.colorMode;
    } catch (e) {
      console.log('getColorMode error: ', e);
      return null;
    }
  };

  function setMode(colorMode: ColorModeEnum): void {
    if (colorMode !== null) {
      setState('colorMode', colorMode);
      setStorageState("colorMode", JSON.stringify({ colorMode }));
    }
  }

  const contextValue = createMemo(() => ({
    ...state,
    setMode,
    getColorMode,
  }));

  return (
    <ThemeContext.Provider value={contextValue()}>
      {props.children}
    </ThemeContext.Provider>
  );
}