import { describe, expect, it } from 'vitest';

import { signUnsubscribeToken } from '../sign-unsubscribe-token.util';
import { verifyUnsubscribeToken } from '../verify-unsubscribe-token.util';

describe('unsubscribe token', () => {
  const merchantId = '0005b6d2-561c-5ecd-831b-fa83b38f481d';

  it('round-trips', () => {
    expect(
      verifyUnsubscribeToken(
        signUnsubscribeToken(merchantId, 'secret'),
        'secret',
      ),
    ).toBe(merchantId);
  });

  it('rejects another secret or a swapped merchant id', () => {
    const token = signUnsubscribeToken(merchantId, 'secret');
    const [, signature] = token.split('.');
    const forged = `${Buffer.from('other-id').toString('base64url')}.${signature}`;

    expect(verifyUnsubscribeToken(token, 'other-secret')).toBeNull();
    expect(verifyUnsubscribeToken(forged, 'secret')).toBeNull();
    expect(verifyUnsubscribeToken('', 'secret')).toBeNull();
  });
});
