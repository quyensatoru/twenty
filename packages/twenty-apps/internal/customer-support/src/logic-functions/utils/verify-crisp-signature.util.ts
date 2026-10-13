import { createHmac, timingSafeEqual } from 'node:crypto';

const isSameHex = (expected: string, received: string): boolean => {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

// Crisp signs `[timestamp;body]` with HMAC-SHA256 and sends the hex digest.
// Its own SDK re-serializes the parsed body, so the raw bytes are tried first
// and JSON.stringify of the parsed body second, in case the two ever differ in
// whitespace or key escaping.
export const verifyCrispSignature = ({
  secret,
  timestamp,
  signature,
  rawBody,
  body,
}: {
  secret: string;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string | undefined;
  body: unknown;
}): boolean => {
  if (
    secret.length === 0 ||
    typeof timestamp !== 'string' ||
    timestamp.length === 0 ||
    typeof signature !== 'string' ||
    signature.length === 0
  ) {
    return false;
  }

  const candidates = [
    rawBody,
    body === undefined || body === null ? undefined : JSON.stringify(body),
  ].filter((candidate): candidate is string => typeof candidate === 'string');

  return candidates.some((candidate) =>
    isSameHex(
      createHmac('sha256', secret)
        .update(`[${timestamp};${candidate}]`)
        .digest('hex'),
      signature.trim().toLowerCase(),
    ),
  );
};
