export default function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...funcArgs: Parameters<T>) => void {
  let debounceTimer: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context as ThisParameterType<T>, args), delay);
  };
}