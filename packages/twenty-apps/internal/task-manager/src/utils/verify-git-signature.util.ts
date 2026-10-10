import { createHmac, timingSafeEqual } from 'node:crypto';

import type { GitProviderName } from '../logic-functions/utils/git-api.util';

// GitHub signs the raw body with the hook secret (`X-Hub-Signature-256:
// sha256=…`); GitLab sends the secret back verbatim (`X-Gitlab-Token`).
// Both compare in constant time.
export const verifyGitWebhookSignature = ({
  provider,
  rawBody,
  secret,
  signatureHeader,
  tokenHeader,
}: {
  provider: GitProviderName;
  rawBody: string | null;
  secret: string;
  signatureHeader?: string;
  tokenHeader?: string;
}): boolean => {
  if (secret === '') {
    return false;
  }

  if (provider === 'gitlab') {
    return (
      typeof tokenHeader === 'string' &&
      tokenHeader !== '' &&
      isEqualConstantTime(tokenHeader, secret)
    );
  }

  if (typeof rawBody !== 'string' || typeof signatureHeader !== 'string') {
    return false;
  }

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

  return (
    signatureHeader.startsWith('sha256=') &&
    isEqualConstantTime(signatureHeader, expected)
  );
};

const isEqualConstantTime = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};
