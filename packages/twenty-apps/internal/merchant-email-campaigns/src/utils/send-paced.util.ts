import { type EmailSendResult } from '../types/email-send-result';
import { delay } from './delay.util';

// Spreads sends evenly at one per intervalMs, and a retryable failure (429 or
// 5xx) pauses every pending send, not just the one that failed, so a rate
// limited service is not hit again until its window has passed.
export const sendPaced = async <TItem>({
  items,
  send,
  intervalMs,
  budgetMs,
  maxAttempts,
  rateLimitCooldownMs,
}: {
  items: TItem[];
  send: (item: TItem, index: number) => Promise<EmailSendResult>;
  intervalMs: number;
  budgetMs: number;
  maxAttempts: number;
  rateLimitCooldownMs: number;
}): Promise<EmailSendResult[]> => {
  const deadline = Date.now() + budgetMs;
  let nextSlotAt = Date.now();
  let cooldownUntil = Date.now();

  const waitForSlot = async (): Promise<boolean> => {
    while (true) {
      const slotAt = Math.max(Date.now(), nextSlotAt, cooldownUntil);

      if (slotAt > deadline) {
        return false;
      }

      nextSlotAt = slotAt + intervalMs;
      await delay(slotAt - Date.now());

      if (cooldownUntil <= Date.now()) {
        return true;
      }
    }
  };

  const sendOne = async (
    item: TItem,
    index: number,
  ): Promise<EmailSendResult> => {
    let lastResult: EmailSendResult | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (!(await waitForSlot())) {
        break;
      }

      lastResult = await send(item, index);

      if (lastResult.ok || !lastResult.isRetryable) {
        return lastResult;
      }

      cooldownUntil = Math.max(
        cooldownUntil,
        Date.now() + (lastResult.retryAfterMs ?? rateLimitCooldownMs),
      );
    }

    return (
      lastResult ?? {
        ok: false,
        error:
          'Not sent: the batch ran out of time waiting for the email service rate limit.',
        isRetryable: true,
      }
    );
  };

  return Promise.all(items.map(sendOne));
};
