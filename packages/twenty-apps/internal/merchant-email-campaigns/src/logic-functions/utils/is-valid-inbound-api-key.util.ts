import { createHash, timingSafeEqual } from 'node:crypto';

import { INBOUND_EVENTS_API_KEY_VARIABLE } from '../../constants/application-variable-names';

const digest = (value: string) => createHash('sha256').update(value).digest();

// Accepts Brevo's `api-key` header, or `x-api-key`. `Authorization` is not an
// option: the server refuses to forward credential headers to a route.
// Hashing both sides first gives equal-length buffers for timingSafeEqual.
export const isValidInboundApiKey = (
  headers: Record<string, string | undefined>,
): boolean => {
  const expected = process.env[INBOUND_EVENTS_API_KEY_VARIABLE]?.trim();

  if (!expected) {
    return false;
  }

  const provided = (
    headers['api-key'] ??
    headers['x-api-key'] ??
    ''
  ).trim();

  return provided !== '' && timingSafeEqual(digest(provided), digest(expected));
};
