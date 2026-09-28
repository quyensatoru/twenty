import { delay } from './delay.util';
import { isPermanentApiError } from './is-permanent-api-error.util';
import { readErrorMessage } from './read-error-message.util';

const TRANSIENT_ATTEMPTS = 3;
const TRANSIENT_DELAY_MS = 300;
// The app's API token bucket refills over about a minute, so a short retry is
// useless against it. Totals 17s, inside the 60s budget of the trigger jobs.
const RATE_LIMIT_WAITS_MS = [2_000, 5_000, 10_000];

export const executeWithRetry = async <TResult>(
  operation: () => Promise<TResult>,
): Promise<TResult> => {
  let transientAttempts = 0;
  let rateLimitAttempts = 0;

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      if (isPermanentApiError(error)) {
        throw error;
      }

      if (/limit reached/i.test(readErrorMessage(error))) {
        if (rateLimitAttempts >= RATE_LIMIT_WAITS_MS.length) {
          throw error;
        }

        await delay(RATE_LIMIT_WAITS_MS[rateLimitAttempts]);
        rateLimitAttempts += 1;
        continue;
      }

      transientAttempts += 1;

      if (transientAttempts >= TRANSIENT_ATTEMPTS) {
        throw error;
      }

      await delay(TRANSIENT_DELAY_MS * transientAttempts);
    }
  }
};
