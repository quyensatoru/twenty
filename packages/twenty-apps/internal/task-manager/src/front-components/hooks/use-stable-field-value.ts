import { useEffect, useRef, useState } from 'react';

const MAX_TRACKED_VALUES = 500;

// The sandbox mirrors a text field's `value` to the host element on every
// render, and the host applies it even when the author has typed further in
// the meantime, so fast typing loses characters. The value handed to the field
// therefore only changes when the PARENT changes it (a reset, a loaded draft);
// typing just reports upwards.
//
// Renders lag behind keystrokes, so the parent can pass back any earlier typed
// value, not only the latest one. Every reported value is remembered, and only
// a value that was never typed counts as an outside change; `fieldKey` then
// remounts the field so the host takes the new text. Putting the field back to
// an earlier typed value (clearing a draft after submit, undoing a paste the
// host applied by itself) therefore needs `reset`, or an outer `key`.
export const useStableFieldValue = (value: string) => {
  const reportedValues = useRef(new Set([value]));
  const [field, setField] = useState({ value, key: 0 });

  useEffect(() => {
    if (reportedValues.current.has(value)) {
      return;
    }

    reportedValues.current = new Set([value]);
    setField((current) => ({ value, key: current.key + 1 }));
  }, [value]);

  const report = (nextValue: string) => {
    if (reportedValues.current.size >= MAX_TRACKED_VALUES) {
      reportedValues.current = new Set();
    }

    reportedValues.current.add(nextValue);
  };

  // Forces the field back to a value it has already seen typed — undoing an
  // edit the host applied on its own, which the effect above deliberately
  // ignores because the value is in the reported set.
  const reset = (nextValue: string) => {
    reportedValues.current = new Set([nextValue]);
    setField((current) => ({ value: nextValue, key: current.key + 1 }));
  };

  return { fieldValue: field.value, fieldKey: field.key, report, reset };
};
