import { type OutgoingEmail } from '../types/outgoing-email';
import { type EmailSendResult } from '../types/email-send-result';
import { postToResend } from './post-to-resend';
import { toResendPayload } from './to-resend-payload';

// One call for up to 100 messages. Resend validates the batch as a whole, so a
// rejection applies to every message in it.
export const sendEmailBatch = async (
  emails: OutgoingEmail[],
  idempotencyKey?: string,
): Promise<EmailSendResult[]> => {
  if (emails.length === 0) {
    return [];
  }

  const result = await postToResend({
    path: '/emails/batch',
    body: emails.map(toResendPayload),
    idempotencyKey,
  });

  if (!result.ok) {
    return emails.map(() => result);
  }

  const data =
    (result.body as { data?: { id?: unknown }[] } | null)?.data ?? [];

  return emails.map((_email, index) => {
    const id = data[index]?.id;

    return { ok: true, id: typeof id === 'string' ? id : '' };
  });
};
