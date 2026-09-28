import { type ResendHttpResult } from '../types/resend-http-result';
import { RESEND_API_BASE_URL } from './resend-api-base-url';
import { readResendApiKey } from './read-resend-api-key';

// 429 and 5xx are worth another attempt; anything else (bad sender domain,
// invalid address) fails the same way every time.
export const postToResend = async ({
  path,
  body,
  idempotencyKey,
}: {
  path: string;
  body: unknown;
  idempotencyKey?: string;
}): Promise<ResendHttpResult> => {
  const apiKey = readResendApiKey();
  let response: Response;

  try {
    response = await fetch(`${RESEND_API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey === undefined
          ? {}
          : { 'Idempotency-Key': idempotencyKey.slice(0, 256) }),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      isRetryable: true,
    };
  }

  const text = await response.text();
  const parsed = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  })();

  if (response.ok) {
    return { ok: true, body: parsed };
  }

  const message =
    typeof parsed === 'object' && parsed !== null && 'message' in parsed
      ? String((parsed as { message: unknown }).message)
      : `Resend responded ${response.status}`;

  return {
    ok: false,
    error: message,
    isRetryable: response.status === 429 || response.status >= 500,
  };
};
