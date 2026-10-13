import { describe, expect, it } from 'vitest';

import { applyMessageToConversation } from '../apply-message-to-conversation.util';

const customerMessage = {
  sender: 'USER' as const,
  senderName: 'Anna',
  messageType: 'text',
  text: 'Still broken',
  fingerprint: '2',
  sentAt: '2026-10-13T10:00:00.000Z',
};

describe('applyMessageToConversation', () => {
  it('starts the wait and reopens a resolved chat when the customer writes', () => {
    expect(
      applyMessageToConversation(
        {
          status: 'RESOLVED',
          lastMessageAt: '2026-10-12T10:00:00.000Z',
          waitingSince: null,
        },
        customerMessage,
      ),
    ).toEqual({
      lastMessageAt: customerMessage.sentAt,
      lastMessageExcerpt: 'Still broken',
      lastMessageFrom: 'USER',
      lastMessageFingerprint: '2',
      waitingSince: customerMessage.sentAt,
      status: 'UNRESOLVED',
    });
  });

  it('keeps the original wait start on a follow-up message', () => {
    const patch = applyMessageToConversation(
      {
        status: 'UNRESOLVED',
        lastMessageAt: '2026-10-13T09:00:00.000Z',
        waitingSince: '2026-10-13T09:00:00.000Z',
      },
      customerMessage,
    );

    expect(patch.waitingSince).toBeUndefined();
  });

  it('ends the wait when support answers', () => {
    expect(
      applyMessageToConversation(
        {
          status: 'UNRESOLVED',
          lastMessageAt: customerMessage.sentAt,
          waitingSince: customerMessage.sentAt,
        },
        {
          ...customerMessage,
          sender: 'OPERATOR',
          senderName: 'Quyen',
          text: 'Fixed!',
          fingerprint: '3',
          sentAt: '2026-10-13T10:05:00.000Z',
        },
      ),
    ).toMatchObject({
      lastMessageFrom: 'OPERATOR',
      waitingSince: null,
      operatorName: 'Quyen',
    });
  });

  it('ignores internal notes', () => {
    expect(
      applyMessageToConversation(
        {
          status: 'UNRESOLVED',
          lastMessageAt: customerMessage.sentAt,
          waitingSince: customerMessage.sentAt,
        },
        {
          ...customerMessage,
          sender: 'OPERATOR',
          messageType: 'note',
          sentAt: '2026-10-13T10:05:00.000Z',
        },
      ),
    ).toEqual({});
  });

  it('does not move the summary back for a late, older delivery', () => {
    const patch = applyMessageToConversation(
      {
        status: 'UNRESOLVED',
        lastMessageAt: '2026-10-13T11:00:00.000Z',
        waitingSince: null,
      },
      customerMessage,
    );

    expect(patch.lastMessageAt).toBeUndefined();
  });
});
