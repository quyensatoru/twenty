import { type EmailSendResult } from '../types/email-send-result';
import { delay } from '../utils/delay.util';

const RETRY_WAITS_MS = [1_000, 3_000, 8_000];

// Retried here rather than through the job queue: a queue retry cannot tell
// its last attempt apart, so the failure would never be written to the log.
export const withSendRetry = async <
  TResult extends EmailSendResult | EmailSendResult[],
>(
  send: () => Promise<TResult>,
): Promise<TResult> => {
  let result = await send();

  for (const waitMs of RETRY_WAITS_MS) {
    const results = Array.isArray(result) ? result : [result];
    const shouldRetry = results.some((item) => !item.ok && item.isRetryable);

    if (!shouldRetry) {
      break;
    }

    await delay(waitMs);
    result = await send();
  }

  return result;
};
