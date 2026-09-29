// A textarea's own selectionStart/selectionEnd never reach the sandbox: the
// host serialises a fixed set of event properties onto the remote element and
// the selection is not among them (applySerializedEventTargetProperties in
// twenty-front-component-renderer copies value, checked, files and the scroll
// and media properties only). What the sandbox does get on every edit is the
// whole new value, so the caret is recovered by diffing it against the previous
// one. That is exact for typing, pasting and deleting; a range selected with
// the mouse stays unknowable, which is why the toolbar inserts a placeholder
// rather than wrapping.
export const deriveCaretPosition = (
  previousValue: string,
  nextValue: string,
): number => {
  const maxCommon = Math.min(previousValue.length, nextValue.length);

  let prefixLength = 0;

  while (
    prefixLength < maxCommon &&
    previousValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength++;
  }

  let suffixLength = 0;

  while (
    suffixLength < maxCommon - prefixLength &&
    previousValue[previousValue.length - 1 - suffixLength] ===
      nextValue[nextValue.length - 1 - suffixLength]
  ) {
    suffixLength++;
  }

  return nextValue.length - suffixLength;
};
