import { useEffect, useRef, useState } from 'react';

// Long enough to be a separate task, so React cannot batch the two value
// changes below into one render, and short enough that nothing is on screen
// in between.
const HOST_VALUE_SWAP_DELAY_MS = 0;

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
// remounts the field so the host takes the new text. Rewriting text the host
// element is already showing (undoing a paste it applied by itself, swapping a
// finished upload's URL in) goes through `applyValueToHost` instead, and
// clearing a draft after submit needs an outer `key`.
export const useStableFieldValue = (value: string) => {
  const reportedValues = useRef(new Set([value]));
  // oxlint-disable-next-line twenty/no-state-useref
  const swapHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [field, setField] = useState({ value, key: 0 });

  useEffect(
    () => () => {
      if (swapHandleRef.current !== null) {
        clearTimeout(swapHandleRef.current);
      }
    },
    [],
  );

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

  // Moves the element's text to `nextValue`, knowing it currently shows
  // `hostValue`. The effect above cannot do it: the text the host is showing
  // was never handed to it through the prop — the browser put it there, on a
  // paste of its own — so the prop may already equal the value being written,
  // and the host skips a write whose prop did not change
  // (syncValuePreservingCaret in twenty-front-component-renderer returns early
  // on an equal value). The prop is therefore first moved to what the element
  // really shows and put back on the next task. Remounting the field would
  // also work and is what this used to do, but it takes the caret out of the
  // box the author is typing in.
  const applyValueToHost = (nextValue: string, hostValue: string) => {
    reportedValues.current = new Set([nextValue]);

    if (hostValue === nextValue) {
      setField((current) => ({ value: nextValue, key: current.key }));

      return;
    }

    setField((current) => ({ value: hostValue, key: current.key }));

    if (swapHandleRef.current !== null) {
      clearTimeout(swapHandleRef.current);
    }

    swapHandleRef.current = setTimeout(() => {
      swapHandleRef.current = null;
      setField((current) => ({ value: nextValue, key: current.key }));
    }, HOST_VALUE_SWAP_DELAY_MS);
  };

  return { fieldValue: field.value, fieldKey: field.key, report, applyValueToHost };
};
