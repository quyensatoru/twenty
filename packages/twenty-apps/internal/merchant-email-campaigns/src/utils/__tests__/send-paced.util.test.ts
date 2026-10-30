import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type EmailSendResult } from '../../types/email-send-result';
import { sendPaced } from '../send-paced.util';

const OK: EmailSendResult = { ok: true, id: 'id' };
const RATE_LIMITED: EmailSendResult = {
  ok: false,
  error: 'Too many requests, please try again later',
  isRetryable: true,
};

const runPaced = async (
  options: Omit<Parameters<typeof sendPaced<number>>[0], 'items'> & {
    count: number;
  },
) => {
  const promise = sendPaced({
    ...options,
    items: Array.from({ length: options.count }, (_, index) => index),
  });

  await vi.runAllTimersAsync();

  return promise;
};

describe('sendPaced', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('spaces sends by the interval', async () => {
    const sentAt: number[] = [];

    const results = await runPaced({
      count: 3,
      send: async () => {
        sentAt.push(Date.now());

        return OK;
      },
      intervalMs: 1_000,
      budgetMs: 60_000,
      maxAttempts: 3,
      rateLimitCooldownMs: 10_000,
    });

    expect(sentAt).toEqual([0, 1_000, 2_000]);
    expect(results.every((result) => result.ok)).toBe(true);
  });

  it('holds every pending send during a rate limit cooldown', async () => {
    const calls: { index: number; at: number }[] = [];

    const results = await runPaced({
      count: 3,
      send: async (index) => {
        calls.push({ index, at: Date.now() });

        return index === 0 && calls.length === 1 ? RATE_LIMITED : OK;
      },
      intervalMs: 1_000,
      budgetMs: 60_000,
      maxAttempts: 3,
      rateLimitCooldownMs: 10_000,
    });

    expect(calls[0]).toEqual({ index: 0, at: 0 });
    expect(calls.slice(1).every(({ at }) => at >= 10_000)).toBe(true);
    expect(results.every((result) => result.ok)).toBe(true);
  });

  it('honors the Retry-After of a 429', async () => {
    const calls: number[] = [];

    await runPaced({
      count: 1,
      send: async () => {
        calls.push(Date.now());

        return calls.length === 1 ? { ...RATE_LIMITED, retryAfterMs: 30_000 } : OK;
      },
      intervalMs: 1_000,
      budgetMs: 60_000,
      maxAttempts: 3,
      rateLimitCooldownMs: 10_000,
    });

    expect(calls).toEqual([0, 30_000]);
  });

  it('fails what cannot start before the budget runs out', async () => {
    const results = await runPaced({
      count: 3,
      send: async () => OK,
      intervalMs: 20_000,
      budgetMs: 30_000,
      maxAttempts: 3,
      rateLimitCooldownMs: 10_000,
    });

    expect(results.map((result) => result.ok)).toEqual([true, true, false]);
  });

  it('does not retry a permanent failure', async () => {
    const send = vi.fn(async () => ({
      ok: false as const,
      error: 'Invalid recipient',
      isRetryable: false,
    }));

    const [result] = await runPaced({
      count: 1,
      send,
      intervalMs: 1_000,
      budgetMs: 60_000,
      maxAttempts: 3,
      rateLimitCooldownMs: 10_000,
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, error: 'Invalid recipient' });
  });
});
