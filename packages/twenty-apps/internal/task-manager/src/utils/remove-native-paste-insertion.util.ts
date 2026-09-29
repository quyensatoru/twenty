export type NativePasteInsertionRemoval = {
  value: string;
  caretPosition: number;
};

// A paste that carries a file also carries that file's path as text, and the
// host never cancels the paste — `preventDefaultForDragAndDropEvents` in
// twenty-front-component-renderer only cancels `dragover` and `drop`, and a
// remote handler's own preventDefault crosses the bridge far too late. So the
// browser drops the path into the box while the app uploads the bytes, and the
// author ends up with the image plus a stale link to where it came from. The
// change that carries that insertion is undone here.
//
// Only an edit that is EXACTLY the pasted text inserted into the previous value
// is undone: any other change is the author typing, and eating that would lose
// their keystroke.
export const removeNativePasteInsertion = (
  previousValue: string,
  nextValue: string,
  pastedText: string,
): NativePasteInsertionRemoval | null => {
  if (pastedText === '') {
    return null;
  }

  if (nextValue.length !== previousValue.length + pastedText.length) {
    return null;
  }

  let insertionIndex = 0;

  while (
    insertionIndex < previousValue.length &&
    previousValue[insertionIndex] === nextValue[insertionIndex]
  ) {
    insertionIndex++;
  }

  // The longest common prefix is the last position the text could have been
  // inserted at, so checking it is enough: when any insertion point produces
  // `nextValue`, this one does.
  const inserted = nextValue.slice(
    insertionIndex,
    insertionIndex + pastedText.length,
  );

  if (inserted !== pastedText) {
    return null;
  }

  if (nextValue.slice(insertionIndex + pastedText.length) !==
    previousValue.slice(insertionIndex)) {
    return null;
  }

  return { value: previousValue, caretPosition: insertionIndex };
};
