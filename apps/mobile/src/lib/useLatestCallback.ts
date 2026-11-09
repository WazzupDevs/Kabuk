import { useCallback, useEffect, useRef } from 'react';

// A function with one identity for the component's life that calls the latest `fn`: a memoised
// row gets it as a prop and is not drawn again when the parent's closure changes.
export function useLatestCallback<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  return useCallback((...args: A) => latest.current(...args), []);
}
