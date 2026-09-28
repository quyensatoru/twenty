// Records carry a fractional `position`; ties fall back to insertion order,
// which is what a stable sort already gives.
export const sortByPosition = <TRecord extends { position?: number | null }>(
  records: readonly TRecord[],
): TRecord[] =>
  records.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
