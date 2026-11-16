import { useEffect, useRef, useState } from 'react';

const MAX_TRACKED_VALUES = 500;

// The sandbox mirrors a text field's `value` to the host element on every
// render, and the host applies it even when the author has typed further in
// the meantime, so fast typing loses characters. The value handed to the field
// therefore only changes when the parent changes it; typing just reports
// upwards.
//
// Renders lag behind keystrokes but arrive in order, so typed values are kept
// as a queue: a value found in it is a lagging render and consumes the queue
// up to it; any other value (a reset to '' included) is an outside change
// and remounts the field so the host takes the new text.
export const useStableFieldValue = (value: string) => {
  const pendingValues = useRef<string[]>([value]);
  const [field, setField] = useState({ value, key: 0 });

  useEffect(() => {
    const index = pendingValues.current.indexOf(value);

    if (index >= 0) {
      pendingValues.current = pendingValues.current.slice(index);

      return;
    }

    pendingValues.current = [value];
    setField((current) => ({ value, key: current.key + 1 }));
  }, [value]);

  const report = (nextValue: string) => {
    if (pendingValues.current.length >= MAX_TRACKED_VALUES) {
      pendingValues.current = pendingValues.current.slice(-1);
    }

    pendingValues.current.push(nextValue);
  };

  return { fieldValue: field.value, fieldKey: field.key, report };
};
