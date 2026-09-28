import { timingSafeEqual } from 'node:crypto';

import { signUnsubscribeToken } from './sign-unsubscribe-token.util';

// Returns the merchant id the token was issued for, or null when it was
// tampered with. There is no expiry: an unsubscribe link must keep working in
// an email opened years later.
export const verifyUnsubscribeToken = (
  token: string,
  secret: string,
): string | null => {
  const [encodedMerchantId] = token.split('.');

  if (encodedMerchantId === undefined || encodedMerchantId === '') {
    return null;
  }

  const merchantId = Buffer.from(encodedMerchantId, 'base64url').toString(
    'utf8',
  );
  const expected = Buffer.from(signUnsubscribeToken(merchantId, secret));
  const received = Buffer.from(token);

  return expected.length === received.length &&
    timingSafeEqual(expected, received)
    ? merchantId
    : null;
};
