import { describe, expect, it } from 'vitest';

import {
  computeCrispConversationId,
  computeCrispMessageId,
} from '../crisp-record-id.util';

const UUID_V5_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('crisp record ids', () => {
  it('derives the same conversation id for the same session', () => {
    const first = computeCrispConversationId({
      websiteId: 'website-1',
      sessionId: 'session_1',
    });

    expect(first).toMatch(UUID_V5_PATTERN);
    expect(
      computeCrispConversationId({
        websiteId: 'website-1',
        sessionId: 'session_1',
      }),
    ).toBe(first);
    expect(
      computeCrispConversationId({
        websiteId: 'website-2',
        sessionId: 'session_1',
      }),
    ).not.toBe(first);
  });

  it('keeps message ids apart from conversation ids', () => {
    expect(
      computeCrispMessageId({
        websiteId: 'website-1',
        sessionId: 'session_1',
        fingerprint: '123',
      }),
    ).not.toBe(
      computeCrispConversationId({
        websiteId: 'website-1',
        sessionId: 'session_1',
      }),
    );
  });
});
