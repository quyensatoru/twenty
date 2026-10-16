import { describe, expect, it } from 'vitest';

import { collapseThreadReplies } from '../collapse-thread-replies.util';

const reply = (id: string, authorId: string, createdAt: string) => ({
  id,
  authorId,
  createdAt,
});

const REPLIES = [
  reply('first', 'alice', '2026-10-16T08:00:00.000Z'),
  reply('second', 'bob', '2026-10-16T09:00:00.000Z'),
  reply('third', 'carol', '2026-10-16T10:00:00.000Z'),
  reply('fourth', 'bob', '2026-10-16T11:00:00.000Z'),
];

describe('collapseThreadReplies', () => {
  it('shows every reply below the threshold', () => {
    const thread = collapseThreadReplies({
      replies: REPLIES.slice(0, 2),
      isExpanded: false,
    });

    expect(thread.visibleReplies.map((item) => item.id)).toEqual([
      'first',
      'second',
    ]);
    expect(thread.hiddenCount).toBe(0);
  });

  it('folds three or more replies to the first one and a summary', () => {
    const thread = collapseThreadReplies({
      replies: REPLIES,
      isExpanded: false,
    });

    expect(thread.visibleReplies.map((item) => item.id)).toEqual(['first']);
    expect(thread.hiddenCount).toBe(3);
    expect(thread.hiddenAuthorIds).toEqual(['bob', 'carol']);
    expect(thread.lastReplyAt).toBe('2026-10-16T11:00:00.000Z');
  });

  it('shows everything once expanded', () => {
    const thread = collapseThreadReplies({
      replies: REPLIES,
      isExpanded: true,
    });

    expect(thread.visibleReplies).toHaveLength(4);
    expect(thread.hiddenCount).toBe(0);
  });

  it('opens by itself when a deep link points at a folded reply', () => {
    const thread = collapseThreadReplies({
      replies: REPLIES,
      isExpanded: false,
      highlightedReplyId: 'third',
    });

    expect(thread.visibleReplies).toHaveLength(4);
  });
});
