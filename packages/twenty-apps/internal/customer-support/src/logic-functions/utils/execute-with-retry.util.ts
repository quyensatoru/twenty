import { readErrorMessage } from './read-error-message.util';

const TRANSIENT_ATTEMPTS = 3;
const TRANSIENT_DELAY_MS = 300;
// The workspace token bucket refills over a minute, so a short retry is
// useless against it; these waits still fit in the shortest function timeout.
const RATE_LIMIT_WAITS_MS = [2_000, 5_000, 10_000];
const PERMANENT_ERROR_PATTERNS = [
  /does not have a field/i,
  /cannot query field/i,
  /not found/i,
  /permission/i,
];

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const isRateLimitError = (error: unknown): boolean =>
  /limit reached|rate limit/i.test(readErrorMessage(error));

export const executeWithRetry = async <TResult>(
  operation: () => Promise<TResult>,
): Promise<TResult> => {
  let transientAttempts = 0;
  let rateLimitAttempts = 0;

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      const message = readErrorMessage(error);

      if (PERMANENT_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
        throw error;
      }

      if (isRateLimitError(error)) {
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
