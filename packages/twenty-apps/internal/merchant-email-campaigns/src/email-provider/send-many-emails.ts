import {
  CUSTOM_EMAIL_MAX_ATTEMPTS,
  CUSTOM_EMAIL_RATE_LIMIT_COOLDOWN_MS,
  CUSTOM_EMAIL_SEND_BUDGET_MS,
} from '../constants/send-limits';
import { readCustomEmailMaxPerMinute } from '../custom-http-client/read-custom-email-max-per-minute';
import { sendCustomHttpEmail } from '../custom-http-client/send-custom-http-email';
import { sendEmailBatch } from '../resend-client/send-email-batch';
import { withSendRetry } from './with-send-retry';
import { type OutgoingEmail } from '../types/outgoing-email';
import { type EmailSendResult } from '../types/email-send-result';
import { sendPaced } from '../utils/send-paced.util';
import { readEmailProviderName } from './read-email-provider-name';

export const sendManyEmails = (
  emails: OutgoingEmail[],
  idempotencyKeyPrefix: string,
): Promise<EmailSendResult[]> =>
  readEmailProviderName() === 'CUSTOM_HTTP'
    ? sendPaced({
        items: emails,
        send: (email, index) =>
          sendCustomHttpEmail(email, `${idempotencyKeyPrefix}:${index}`),
        intervalMs: 60_000 / readCustomEmailMaxPerMinute(),
        budgetMs: CUSTOM_EMAIL_SEND_BUDGET_MS,
        maxAttempts: CUSTOM_EMAIL_MAX_ATTEMPTS,
        rateLimitCooldownMs: CUSTOM_EMAIL_RATE_LIMIT_COOLDOWN_MS,
      })
    : withSendRetry(() => sendEmailBatch(emails, idempotencyKeyPrefix));
