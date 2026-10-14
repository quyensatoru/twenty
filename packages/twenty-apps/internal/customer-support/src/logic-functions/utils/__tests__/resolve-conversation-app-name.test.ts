import { describe, expect, it } from 'vitest';

import { resolveConversationAppName } from '../resolve-conversation-app-name.util';

describe('resolveConversationAppName', () => {
  it('keeps the website product when its own flag is set', () => {
    expect(
      resolveConversationAppName('BLOY', {
        using_bloy: true,
        using_eu_withdrawal: true,
      }),
    ).toBe('BLOY');
  });

  it('picks the sharing product when only its flag is set', () => {
    expect(
      resolveConversationAppName('BLOY', { using_eu_withdrawal: 'true' }),
    ).toBe('EU');
    expect(resolveConversationAppName('MIDA', { using_mida_fraud: true })).toBe(
      'FRAUD',
    );
  });

  it('ignores a flag set to false', () => {
    expect(
      resolveConversationAppName('BLOY', {
        using_bloy: 'false',
        using_eu_withdrawal: false,
      }),
    ).toBe('BLOY');
  });

  it('keeps the website product without any flag', () => {
    expect(resolveConversationAppName('MIDA', null)).toBe('MIDA');
    expect(resolveConversationAppName('MIDA', { using_bloy: true })).toBe(
      'MIDA',
    );
  });

  it('keeps a product that shares no website', () => {
    expect(resolveConversationAppName('Demo Shop', { using_mida: true })).toBe(
      'Demo Shop',
    );
  });
});
