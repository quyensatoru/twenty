// The sandbox mirrors only the properties the host chooses to serialise onto a
// remote element, and selectionStart/selectionEnd are not among them today. The
// read is kept because it is free and correct the moment they are, and the
// composer falls back to the end of the text when it returns null.
export const readTextareaSelection = (
  eventTarget: unknown,
): { start: number; end: number } | null => {
  if (eventTarget === null || typeof eventTarget !== 'object') {
    return null;
  }

  const { selectionStart, selectionEnd } = eventTarget as {
    selectionStart?: unknown;
    selectionEnd?: unknown;
  };

  if (typeof selectionStart !== 'number' || typeof selectionEnd !== 'number') {
    return null;
  }

  return { start: selectionStart, end: selectionEnd };
};
