export type LazyInitFn<T, V extends unknown[]> = {
  /**
   * Function that returns a result of the initial call to the bootstrapper function
   */
  (...args: V): T;

  /**
   * Resets value memoised in the initialiser function
   */
  reset(): void;
};

export function lazyInit<T, V extends unknown[]>(
  /**
   * Bootstrap function that initialises the memoised value
   */
  bootstrapper: (...args: V) => T,
): LazyInitFn<T, V> {
  let instance: T | undefined;

  const init = (...args: V) => {
    if (!instance) {
      instance = bootstrapper(...args);
    }

    return instance;
  };

  init.reset = () => (instance = undefined);

  return init;
}
