import { useEffect, useMemo } from "react";

type Disposable = { dispose: () => void };

/**
 * useMemo for GPU resources (geometries, materials, textures) that also disposes
 * them on unmount / when deps change. Prevents GPU memory leaks when the hero
 * is navigated away from or rebuilt.
 */
export function useDisposable<T>(factory: () => T, deps: React.DependencyList, collect: (v: T) => Disposable[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => {
    return () => {
      for (const d of collect(value)) d.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return value;
}
