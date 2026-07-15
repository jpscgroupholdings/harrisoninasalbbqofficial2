import { useCallback, useState } from "react";

export function useToggleSet<T = string>(initial?: Iterable<T>) {
  const [openKeys, setOpenKeys] = useState<Set<T>>(() => new Set(initial));

  const isOpen = useCallback((key: T) => openKeys.has(key), [openKeys]);

  const toggle = useCallback((key: T) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const close = useCallback((key: T) => {
    setOpenKeys((prev) => {
      if (!prev.has(key)) return prev;

      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => setOpenKeys(new Set()), []);

  return { isOpen, toggle, close, closeAll };
}
