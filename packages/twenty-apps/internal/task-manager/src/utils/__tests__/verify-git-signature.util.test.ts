import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { verifyGitWebhookSignature } from '../verify-git-signature.util';

describe('verifyGitWebhookSignature', () => {
  it('verifies GitHub HMAC signatures', () => {
    const rawBody = '{"ref":"refs/heads/PROJ-1-x"}';
    const signature = `sha256=${createHmac('sha256', 's3cret').update(rawBody).digest('hex')}`;

    expect(
      verifyGitWebhookSignature({
        provider: 'github',
        rawBody,
        secret: 's3cret',
        signatureHeader: signature,
      }),
    ).toBe(true);
    expect(
      verifyGitWebhookSignature({
        provider: 'github',
        rawBody,
        secret: 'wrong',
        signatureHeader: signature,
      }),
    ).toBe(false);
    expect(
      verifyGitWebhookSignature({
        provider: 'github',
        rawBody,
        secret: 's3cret',
        signatureHeader: 'sha256=dead',
      }),
    ).toBe(false);
  });

  it('compares GitLab tokens', () => {
    expect(
      verifyGitWebhookSignature({
        provider: 'gitlab',
        rawBody: null,
        secret: 'tok',
        tokenHeader: 'tok',
      }),
    ).toBe(true);
    expect(
      verifyGitWebhookSignature({
        provider: 'gitlab',
        rawBody: null,
        secret: 'tok',
        tokenHeader: 'other',
      }),
    ).toBe(false);
    expect(
      verifyGitWebhookSignature({
        provider: 'gitlab',
        rawBody: null,
        secret: '',
        tokenHeader: '',
      }),
    ).toBe(false);
  });
});
