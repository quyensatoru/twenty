import { sendCustomHttpEmail } from '../custom-http-client/send-custom-http-email';
import { sendEmailBatch } from '../resend-client/send-email-batch';
import { withSendRetry } from './with-send-retry';
import { type OutgoingEmail } from '../types/outgoing-email';
import { type EmailSendResult } from '../types/email-send-result';
import { readEmailProviderName } from './read-email-provider-name';

// A custom service has no batch endpoint, so a page goes out a few messages
// at a time: enough to finish 100 well inside the job timeout without
// flooding a service sized for transactional mail.
const CUSTOM_HTTP_CONCURRENCY = 5;

const sendWithConcurrency = async (
  emails: OutgoingEmail[],
  idempotencyKeyPrefix: string,
): Promise<EmailSendResult[]> => {
  const results: EmailSendResult[] = new Array(emails.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < emails.length) {
      const index = nextIndex;

      nextIndex += 1;
      results[index] = await withSendRetry(() =>
        sendCustomHttpEmail(emails[index], `${idempotencyKeyPrefix}:${index}`),
      );
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(CUSTOM_HTTP_CONCURRENCY, emails.length) },
      worker,
    ),
  );

  return results;
};

export const sendManyEmails = (
  emails: OutgoingEmail[],
  idempotencyKeyPrefix: string,
): Promise<EmailSendResult[]> =>
  readEmailProviderName() === 'CUSTOM_HTTP'
    ? sendWithConcurrency(emails, idempotencyKeyPrefix)
    : withSendRetry(() => sendEmailBatch(emails, idempotencyKeyPrefix));
