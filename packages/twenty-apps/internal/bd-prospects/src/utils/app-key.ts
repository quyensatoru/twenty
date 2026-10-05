// App names arrive from three places (the `app` object, CSV files, humans), so
// they are folded into one shape before they reach `prospect.appsUsed`.
// The filter behind the upsell views is a case-insensitive `%key%` match, so
// two keys must never be prefixes of one another.
export const toAppKey = (rawName: string): string | null => {
  const key = rawName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');

  return key.length === 0 ? null : key;
};

export const mergeAppKeys = (
  current: string[] | null | undefined,
  incoming: string[],
): string[] =>
  [
    ...new Set([...(current ?? []), ...incoming].filter((key) => key !== '')),
  ].sort();
