import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { verifyCrispSignature } from '../verify-crisp-signature.util';

const SECRET = 'hook-secret';
const TIMESTAMP = '1760000000000';
const BODY = {
  website_id: 'website-1',
  event: 'message:send',
  data: { session_id: 'session_1', content: 'Hello' },
  timestamp: 1760000000000,
};

const sign = (payload: string): string =>
  createHmac('sha256', SECRET)
    .update(`[${TIMESTAMP};${payload}]`)
    .digest('hex');

describe('verifyCrispSignature', () => {
  it('accepts the signature Crisp computes over the serialized body', () => {
    expect(
      verifyCrispSignature({
        secret: SECRET,
        timestamp: TIMESTAMP,
        signature: sign(JSON.stringify(BODY)),
        rawBody: undefined,
        body: BODY,
      }),
    ).toBe(true);
  });

  it('accepts a signature over the raw body even when it is formatted differently', () => {
    const rawBody = JSON.stringify(BODY, null, 2);

    expect(
      verifyCrispSignature({
        secret: SECRET,
        timestamp: TIMESTAMP,
        signature: sign(rawBody),
        rawBody,
        body: BODY,
      }),
    ).toBe(true);
  });

  it('rejects a body that was tampered with', () => {
    expect(
      verifyCrispSignature({
        secret: SECRET,
        timestamp: TIMESTAMP,
        signature: sign(JSON.stringify(BODY)),
        rawBody: undefined,
        body: { ...BODY, event: 'session:removed' },
      }),
    ).toBe(false);
  });

  it('rejects everything while no secret is configured', () => {
    expect(
      verifyCrispSignature({
        secret: '',
        timestamp: TIMESTAMP,
        signature: sign(JSON.stringify(BODY)),
        rawBody: undefined,
        body: BODY,
      }),
    ).toBe(false);
  });
});
