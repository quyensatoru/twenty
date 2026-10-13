import { describe, expect, it } from 'vitest';

import {
  buildTranscript,
  parseSummaryReply,
} from '../summarize-conversation.util';

describe('parseSummaryReply', () => {
  it('reads the JSON object even when the model wraps it in prose', () => {
    expect(
      parseSummaryReply(
        'Here you go:\n```json\n{"summary":"- Khách cần bật app embed","problem":"App embed chưa bật","nextStep":"Gửi hướng dẫn"}\n```',
      ),
    ).toEqual({
      summary: '- Khách cần bật app embed',
      problem: 'App embed chưa bật',
      nextStep: 'Gửi hướng dẫn',
    });
  });

  it('falls back to the whole reply when there is no JSON', () => {
    expect(parseSummaryReply('Customer asked about billing.')).toEqual({
      summary: 'Customer asked about billing.',
      problem: null,
      nextStep: null,
    });
  });
});

describe('buildTranscript', () => {
  it('labels speakers and skips system events', () => {
    expect(
      buildTranscript([
        {
          text: 'Heatmap is empty',
          sender: 'USER',
          messageType: 'text',
          sentAt: '2026-10-13T09:00:00.000Z',
        },
        {
          text: 'Embed disabled',
          sender: 'OPERATOR',
          senderName: 'Quyen',
          messageType: 'note',
          sentAt: '2026-10-13T09:01:00.000Z',
        },
        { text: 'state:resolved', messageType: 'event', sentAt: null },
      ]),
    ).toBe(
      '[2026-10-13 09:00] Customer: Heatmap is empty\n[2026-10-13 09:01] Internal note (Quyen): Embed disabled',
    );
  });
});
