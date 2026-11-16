// Twenty returns an unset text field as '' rather than null; the routes treat
// both as "no value", so reads turn top-level empty strings into null.
export const normalizeEmptyStrings = <TRecord>(record: TRecord): TRecord => {
  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return record;
  }

  return Object.fromEntries(
    Object.entries(record as Record<string, unknown>).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  ) as TRecord;
};
