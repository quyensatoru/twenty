import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  executeWithRetry,
  isPermanentError,
  isRateLimitError,
} from '../execute-with-retry';
import {
  requestPacingIntervalMs,
  resetRequestPacing,
  waitForRequestSlot,
} from '../rate-limiter';

const rateLimitError = () =>
  new Error('Limit reached (500 tokens per 60000 ms)');

afterEach(() => {
  vi.useRealTimers();
  resetRequestPacing();
});

describe('isRateLimitError', () => {
  it('recognises the throttler message on an Error', () => {
    expect(isRateLimitError(rateLimitError())).toBe(true);
  });

  it('recognises it inside a graphql error list', () => {
    expect(
      isRateLimitError({ errors: [{ message: 'Limit reached (500 tokens)' }] }),
    ).toBe(true);
  });

  it('recognises it on a bare string', () => {
    expect(isRateLimitError('Limit reached')).toBe(true);
  });

  it('does not mistake other failures for a rate limit', () => {
    expect(isRateLimitError(new Error('Permission denied'))).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
  });
});

describe('executeWithRetry', () => {
  it('returns the result of a call that works', async () => {
    resetRequestPacing();

    await expect(executeWithRetry(async () => 'done')).resolves.toBe('done');
  });

  it('waits out a rate limit instead of failing', async () => {
    vi.useFakeTimers();
    resetRequestPacing();

    const operation = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError())
      .mockResolvedValueOnce('done');

    const result = executeWithRetry(operation);

    await vi.advanceTimersByTimeAsync(2_000);

    await expect(result).resolves.toBe('done');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('gives up once the rate-limit waits are exhausted', async () => {
    vi.useFakeTimers();
    resetRequestPacing();

    const operation = vi.fn().mockRejectedValue(rateLimitError());
    const result = executeWithRetry(operation);
    const assertion = expect(result).rejects.toThrow('Limit reached');

    await vi.advanceTimersByTimeAsync(32_000);
    await assertion;

    expect(operation).toHaveBeenCalledTimes(5);
  });

  it('retries a transient failure a few times only', async () => {
    vi.useFakeTimers();
    resetRequestPacing();

    const operation = vi.fn().mockRejectedValue(new Error('socket hang up'));
    const result = executeWithRetry(operation);
    const assertion = expect(result).rejects.toThrow('socket hang up');

    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;

    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe('waitForRequestSlot', () => {
  it('spaces consecutive requests to stay under the app rate limit', async () => {
    vi.useFakeTimers();
    resetRequestPacing();

    const first = waitForRequestSlot();
    const second = waitForRequestSlot();
    const third = waitForRequestSlot();

    await vi.advanceTimersByTimeAsync(requestPacingIntervalMs * 3);

    expect(await first).toBe(0);
    expect(await second).toBe(requestPacingIntervalMs);
    expect(await third).toBe(requestPacingIntervalMs * 2);
  });

  it('stays under 500 requests per minute', () => {
    expect(60_000 / requestPacingIntervalMs).toBeLessThan(500);
  });
});

describe('isPermanentError', () => {
  it('recognises a selection the workspace cannot answer', () => {
    expect(
      isPermanentError(new Error('type `Merchant` does not have a field `email`')),
    ).toBe(true);
    expect(
      isPermanentError(new Error("Object merchant doesn't have any \"using\" field.")),
    ).toBe(true);
  });

  it('does not treat a rate limit as permanent', () => {
    expect(isPermanentError(rateLimitError())).toBe(false);
  });

  it('stops retrying a schema error on the first attempt', async () => {
    resetRequestPacing();

    const operation = vi
      .fn()
      .mockRejectedValue(new Error('type `Merchant` does not have a field `email`'));

    await expect(executeWithRetry(operation)).rejects.toThrow('does not have a field');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
