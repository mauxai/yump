"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [stored, setStored] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setStored(JSON.parse(item) as T);
    } catch {
      // ignore parse errors
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const next = value instanceof Function ? value(stored) : value;
        setStored(next);
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
    },
    [key, stored],
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStored(initialValue);
    } catch {
      // ignore
    }
  }, [key, initialValue]);

  return [stored, setValue, remove];
}
