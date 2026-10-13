import { describe, expect, it } from 'vitest';

import {
  buildCrispExcerpt,
  mapCrispMessage,
  readCrispMessageText,
} from '../map-crisp-message.util';

describe('mapCrispMessage', () => {
  it('maps a visitor text message', () => {
    const record = mapCrispMessage({
      payload: {
        type: 'text',
        from: 'user',
        content: 'The heatmap is empty',
        fingerprint: 163408415,
        timestamp: 1760000000000,
        user: { nickname: 'Anna' },
      },
      websiteId: 'website-1',
      sessionId: 'session_1',
      conversationId: 'conversation-1',
    });

    expect(record).toMatchObject({
      conversationId: 'conversation-1',
      fingerprint: '163408415',
      sender: 'USER',
      senderName: 'Anna',
      messageType: 'text',
      text: 'The heatmap is empty',
      content: null,
      sentAt: new Date(1760000000000).toISOString(),
    });
  });

  it('skips a message without a fingerprint', () => {
    expect(
      mapCrispMessage({
        payload: { type: 'text', from: 'operator', content: 'Hi' },
        websiteId: 'website-1',
        sessionId: 'session_1',
        conversationId: 'conversation-1',
      }),
    ).toBeUndefined();
  });
});

describe('readCrispMessageText', () => {
  it('names a file by its file name', () => {
    expect(
      readCrispMessageText('file', {
        name: 'screenshot.png',
        url: 'https://x',
        type: 'image/png',
      }),
    ).toBe('screenshot.png');
  });

  it('shows the picked answer of a picker', () => {
    expect(
      readCrispMessageText('picker', {
        text: 'What do you need?',
        choices: [
          { label: 'Billing', selected: false },
          { label: 'Install help', selected: true },
        ],
      }),
    ).toBe('What do you need? → Install help');
  });
});

describe('buildCrispExcerpt', () => {
  it('collapses whitespace and truncates long text', () => {
    const excerpt = buildCrispExcerpt(`Line one\n\n${'x'.repeat(300)}`);

    expect(excerpt.startsWith('Line one x')).toBe(true);
    expect(excerpt.length).toBe(160);
    expect(excerpt.endsWith('…')).toBe(true);
  });
});
