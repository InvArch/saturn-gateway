import { createEffect, createSignal, onCleanup } from "solid-js";

const EllipsisAnimation = () => {
  const [dots, setDots] = createSignal('...');

  createEffect(() => {
    const interval = setInterval(() => {
      setDots(dots() === '...' ? '.' : dots() === '.' ? '..' : '...');
    }, 1000);

    onCleanup(() => clearInterval(interval));
  });

  return <>
    {dots()}
  </>;
};

EllipsisAnimation.displayName = 'EllipsisAnimation';
export default EllipsisAnimation;
