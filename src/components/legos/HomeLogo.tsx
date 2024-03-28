import { Show, createEffect, createMemo, createSignal, on } from "solid-js";
import { ColorModeEnum } from "../left-side/ColorSwitch";
import { useThemeContext } from "../../providers/themeProvider";
import OmniwayLogo from "../../assets/icons/omniway-logo.svg";

const HomeLogo = () => {
  const [lightMode, setLightMode] = createSignal<boolean>(false);

  const theme = useThemeContext();

  const colorMode = createMemo(() => theme.getColorMode());

  createEffect(on(colorMode, () => {
    if (colorMode() === ColorModeEnum.LIGHT) {
      setLightMode(true);
    } else {
      setLightMode(false);
    }
  }));

  return <>
    <img id="omniway-logo-landing" src={OmniwayLogo} class="flex" alt="OmniWay Logo" />
  </>;
};

HomeLogo.displayName = "HomeLogo";
export default HomeLogo;