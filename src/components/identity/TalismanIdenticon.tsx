import { createMemo } from 'solid-js';
import { encodeAddress } from '@polkadot/util-crypto';
import { HSL, HSV, display as asCssColor, to as toColorSpace } from 'colorjs.io/fn';
import md5 from 'md5';

export type TalismanIdenticonProps = {
  value: string;
  size?: number | string;
  className?: string;
};

const djb2 = (str: string) => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) + hash + str.charCodeAt(i);
  return hash;
};

const valueFromHash = (hash: string, max: number) => {
  return (max + djb2(hash)) % max;
};

const colorFromHash = (hash: string) =>
  toColorSpace({ space: HSV, coords: [valueFromHash(hash, 360), 100, 100] as [number, number, number], alpha: 1 }, HSL);

const rotateText = (text: string, nbChars = 0) => text.slice(nbChars) + text.slice(0, nbChars);

export default function TalismanIdenticon(props: TalismanIdenticonProps) {
  const memo = createMemo(() => {
    const address = encodeAddress(props.value);

    const hash1 = md5(address);
    const hash2 = rotateText(hash1, 1);
    const hash3 = rotateText(hash1, 2);

    const colors = [colorFromHash(hash1), colorFromHash(hash2), colorFromHash(hash3)]
      .sort((c1, c2) => (c1.coords[2] ?? 0) - (c2.coords[2] ?? 0))
      .map(x => asCssColor(x));

    // random location in top left corner, avoid being to close from the center
    const dotX = 10 + valueFromHash(hash1, 10);
    const dotY = 10 + valueFromHash(hash2, 10);

    // global rotation
    const rotation = valueFromHash(hash1, 360);


    return {
      bgColor1: colors[0],
      bgColor2: colors[1],
      glowColor: colors[2],
      transform: `rotate(${ rotation } 32 32)`,
      cx: dotX,
      cy: dotY,
    };
  });

  return (
    <svg
      class={props.className}
      width={props.size}
      height={props.size}
      viewBox={`0 0 64 64`}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${ props.value }-bg`}>
          <stop offset="20%" stop-color={memo().bgColor1} />
          <stop offset="100%" stop-color={memo().bgColor2} />
        </linearGradient>
        <radialGradient id={`${ props.value }-circle`}>
          <stop offset="10%" stop-color={memo().glowColor} />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
        <clipPath id={`${ props.value }-clip`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clip-path={`url(#${ props.value }-clip)`}>
        <g transform={memo().transform}>
          <rect fill={`url(#${ props.value }-bg)`} x={0} y={0} width={64} height={64} />
          <circle fill={`url(#${ props.value }-circle)`} cx={memo().cx} cy={memo().cy} r={45} opacity={0.7} />
        </g>
      </g>
    </svg>
  );
}
