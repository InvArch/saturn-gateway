import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { ColorModeEnum } from "../left-side/ColorSwitch";
import { useThemeContext } from "../../providers/themeProvider";
import OmniwayLogo from "../../assets/icons/omniway-logo.svg";
import { A, useLocation } from "@solidjs/router";

const SaturnLogo = () => {
  const [lightMode, setLightMode] = createSignal<boolean>(false);
  const theme = useThemeContext();
  const loc = useLocation();

  const colorMode = createMemo(() => theme.getColorMode());
  const atHome = createMemo(() => {
    return loc.pathname === '/';
  });

  createEffect(on(colorMode, () => {
    if (colorMode() === ColorModeEnum.LIGHT) {
      setLightMode(true);
    } else {
      setLightMode(false);
    }
  }));

  return <A href="/" class={`flex ${ !atHome() ? 'md:mr-24' : '' }`}>
    <img id="omniway-logo" src={OmniwayLogo} class="h-8 my-3 mr-3 max-w-xs w-2/3 sm:w-auto" alt="OmniWay Logo" />
  </A>;
};

SaturnLogo.displayName = "SaturnLogo";
export default SaturnLogo;