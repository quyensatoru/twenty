// The routing key. Both sides of a match go through this, so `Trial Ending`
// from the studio and `trial_ending` from the sender are the same event: a
// free-text field that only matched byte for byte would fail silently.
export const normalizeEventName = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized === '' ? null : normalized;
};
