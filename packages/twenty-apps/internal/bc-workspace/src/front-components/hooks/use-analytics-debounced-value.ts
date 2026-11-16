import { useEffect, useState } from 'react';

export const useAnalyticsDebouncedValue = <TValue>(
  value: TValue,
  delayMs: number,
): TValue => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
