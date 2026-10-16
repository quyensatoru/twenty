import { describe, expect, it } from 'vitest';

import { isGroupedFeedItem } from '../is-grouped-feed-item.util';

describe('isGroupedFeedItem', () => {
  const first = { authorId: 'alice', timestamp: '2026-10-16T10:00:00.000Z' };

  it('groups the same author within five minutes', () => {
    expect(
      isGroupedFeedItem(first, {
        authorId: 'alice',
        timestamp: '2026-10-16T10:04:59.000Z',
      }),
    ).toBe(true);
  });

  it('groups in either order, so a newest-first list groups the same pairs', () => {
    expect(
      isGroupedFeedItem(
        { authorId: 'alice', timestamp: '2026-10-16T10:03:00.000Z' },
        first,
      ),
    ).toBe(true);
  });

  it('starts a new group past five minutes or for another author', () => {
    expect(
      isGroupedFeedItem(first, {
        authorId: 'alice',
        timestamp: '2026-10-16T10:05:01.000Z',
      }),
    ).toBe(false);
    expect(
      isGroupedFeedItem(first, {
        authorId: 'bob',
        timestamp: '2026-10-16T10:01:00.000Z',
      }),
    ).toBe(false);
  });

  it('never groups the first row, an unknown author or an unreadable time', () => {
    expect(isGroupedFeedItem(undefined, first)).toBe(false);
    expect(
      isGroupedFeedItem(
        { authorId: null, timestamp: first.timestamp },
        { authorId: null, timestamp: first.timestamp },
      ),
    ).toBe(false);
    expect(
      isGroupedFeedItem(first, { authorId: 'alice', timestamp: 'not a date' }),
    ).toBe(false);
  });
});
