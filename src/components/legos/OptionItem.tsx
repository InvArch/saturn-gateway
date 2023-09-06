import { JSX, JSXElement, mergeProps } from "solid-js";

const OptionItem = (props: JSX.LiHTMLAttributes<HTMLLIElement>): JSXElement => {
  const mergedProps = mergeProps(props);
  return <li class="pl-3 py-2 hover:bg-saturn-darkpurple dark:text-white inline-flex items-center gap-1 w-full hover:cursor-pointer" {...mergedProps}>
    {mergedProps.children}
  </li>;
};

OptionItem.displayName = 'OptionItem';
export default OptionItem;