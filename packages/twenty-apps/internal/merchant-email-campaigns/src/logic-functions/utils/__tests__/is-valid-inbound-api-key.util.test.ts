import { afterEach, describe, expect, it } from 'vitest';

import { isValidInboundApiKey } from '../is-valid-inbound-api-key.util';

describe('isValidInboundApiKey', () => {
  afterEach(() => {
    delete process.env.INBOUND_EVENTS_API_KEY;
  });

  it('refuses everything while no key is configured', () => {
    expect(isValidInboundApiKey({ 'api-key': '' })).toBe(false);
  });

  it('accepts the Brevo header, x-api-key and a bearer token', () => {
    process.env.INBOUND_EVENTS_API_KEY = 'secret';

    expect(isValidInboundApiKey({ 'api-key': 'secret' })).toBe(true);
    expect(isValidInboundApiKey({ 'x-api-key': 'secret' })).toBe(true);
    expect(isValidInboundApiKey({ authorization: 'Bearer secret' })).toBe(true);
    expect(isValidInboundApiKey({ 'api-key': 'wrong' })).toBe(false);
  });
});
