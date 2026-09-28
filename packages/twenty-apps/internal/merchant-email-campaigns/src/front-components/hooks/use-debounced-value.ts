import { useEffect, useState } from 'react';

// Rendering the preview runs the CSS inliner over the whole document, which is
// slow enough per keystroke that the sandbox echoes a stale textarea value
// back over what the author just typed. Delaying the preview keeps typing on
// the fast path.
export const useDebouncedValue = <TValue>(
  value: TValue,
  delayMs: number,
): TValue => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);

    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
};
