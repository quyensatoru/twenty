export type SortDirection = 'ASC' | 'DESC';

export type SortState = { key: string; direction: SortDirection } | null;

export type SortValue = string | number | boolean | null | undefined;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;

const normalize = (value: SortValue): string | number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    const time = Date.parse(value);

    return Number.isNaN(time) ? value : time;
  }

  return value;
};

// Dates as dates, numbers as numbers, text locale-aware; empty values always
// last whatever the direction, and the id breaks ties so pages stay stable.
export const compareSortValues = (
  left: SortValue,
  right: SortValue,
  direction: SortDirection,
): number => {
  const a = normalize(left);
  const b = normalize(right);

  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  const order =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), undefined, {
          numeric: true,
          sensitivity: 'base',
        });

  return direction === 'ASC' ? order : -order;
};

export const sortRecords = <TRecord extends { id: string }>(
  records: TRecord[],
  sort: SortState,
  readValue: (record: TRecord, key: string) => SortValue,
  fallback: SortState = null,
): TRecord[] => {
  const effective = sort ?? fallback;

  if (effective === null) {
    return [...records];
  }

  return [...records].sort(
    (left, right) =>
      compareSortValues(
        readValue(left, effective.key),
        readValue(right, effective.key),
        effective.direction,
      ) || left.id.localeCompare(right.id),
  );
};

export const paginate = <TItem>(
  items: TItem[],
  page: number,
  pageSize: number,
): { items: TItem[]; page: number; pageCount: number; total: number } => {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);

  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageCount,
    total,
  };
};

export const readSortState = (value: unknown): SortState => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { key, direction } = value as { key?: unknown; direction?: unknown };

  return typeof key === 'string' && (direction === 'ASC' || direction === 'DESC')
    ? { key, direction }
    : null;
};
