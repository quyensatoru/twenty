import { describe, expect, it } from 'vitest';

import { paginate, sortRecords } from '../sort-records.util';

const rows = [
  { id: 'a', name: 'beta', amount: 10, date: '2026-11-02T00:00:00.000Z' },
  { id: 'b', name: 'Alpha', amount: 2, date: null },
  { id: 'c', name: 'gamma', amount: 100, date: '2026-10-01T00:00:00.000Z' },
];

const read = (row: (typeof rows)[number], key: string) =>
  row[key as keyof typeof row];

describe('sortRecords', () => {
  it('sorts numbers numerically and text without case', () => {
    expect(sortRecords(rows, { key: 'amount', direction: 'ASC' }, read).map((row) => row.id)).toEqual(['b', 'a', 'c']);
    expect(sortRecords(rows, { key: 'name', direction: 'DESC' }, read).map((row) => row.id)).toEqual(['c', 'a', 'b']);
  });

  it('sorts dates as dates and keeps empty values last both ways', () => {
    expect(sortRecords(rows, { key: 'date', direction: 'ASC' }, read).map((row) => row.id)).toEqual(['c', 'a', 'b']);
    expect(sortRecords(rows, { key: 'date', direction: 'DESC' }, read).map((row) => row.id)).toEqual(['a', 'c', 'b']);
  });

  it('falls back to the default order when unsorted', () => {
    expect(
      sortRecords(rows, null, read, { key: 'amount', direction: 'DESC' }).map((row) => row.id),
    ).toEqual(['c', 'a', 'b']);
  });
});

describe('paginate', () => {
  it('clamps the page to the last one', () => {
    expect(paginate([1, 2, 3, 4, 5], 9, 2)).toEqual({ items: [5], page: 3, pageCount: 3, total: 5 });
  });
});
