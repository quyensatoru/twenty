import { delay, waitForRequestSlot } from './rate-limiter';

const TRANSIENT_ATTEMPTS = 3;
const TRANSIENT_DELAY_MS = 300;
// Refilling the app's token bucket takes up to a minute, so a 300ms retry is
// useless against it. These waits total 32s, which still fits inside the 60s
// timeout the trigger functions run under.
const RATE_LIMIT_WAITS_MS = [2_000, 5_000, 10_000, 15_000];

const readErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  const candidate = error as
    | { message?: unknown; errors?: { message?: unknown }[] }
    | null
    | undefined;

  if (typeof candidate?.message === 'string') {
    return candidate.message;
  }

  const nested = candidate?.errors?.[0]?.message;

  if (typeof nested === 'string') {
    return nested;
  }

  return String(error);
};

export const isRateLimitError = (error: unknown): boolean =>
  /limit reached/i.test(readErrorMessage(error));

// A selection the workspace cannot answer will never start working, and the
// merchant field probe relies on failing on the first attempt.
const PERMANENT_ERROR_PATTERNS = [
  /does not have a field/i,
  /doesn't have any/i,
  /cannot query field/i,
];

export const isPermanentError = (error: unknown): boolean => {
  const message = readErrorMessage(error);

  return PERMANENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  let transientAttempts = 0;
  let rateLimitAttempts = 0;
  let lastError: unknown;

  for (;;) {
    await waitForRequestSlot();

    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (isPermanentError(error)) {
        break;
      }

      if (isRateLimitError(error)) {
        if (rateLimitAttempts >= RATE_LIMIT_WAITS_MS.length) {
          break;
        }

        await delay(RATE_LIMIT_WAITS_MS[rateLimitAttempts]);
        rateLimitAttempts += 1;

        continue;
      }

      transientAttempts += 1;

      if (transientAttempts >= TRANSIENT_ATTEMPTS) {
        break;
      }

      await delay(TRANSIENT_DELAY_MS * transientAttempts);
    }
  }

  throw lastError;
};
