import { describe, expect, it } from 'vitest';

import { mergeIssueConversations } from '../merge-issue-conversations.util';

describe('mergeIssueConversations', () => {
  it("lists each chat once, the merchants' and the linked ones, newest first", () => {
    expect(
      mergeIssueConversations(
        [
          { id: 'linked-old', lastMessageAt: '2026-10-01T00:00:00.000Z' },
          { id: 'both', lastMessageAt: '2026-10-05T00:00:00.000Z' },
        ],
        [
          { id: 'both', lastMessageAt: '2026-10-05T00:00:00.000Z' },
          { id: 'merchant-new', lastMessageAt: '2026-10-09T00:00:00.000Z' },
          { id: 'never-written', lastMessageAt: null },
        ],
      ).map((conversation) => conversation.id),
    ).toEqual(['merchant-new', 'both', 'linked-old', 'never-written']);
  });
});
