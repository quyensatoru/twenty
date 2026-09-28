import { type OutgoingEmail } from '../types/outgoing-email';
import { type EmailSendResult } from '../types/email-send-result';
import { postToResend } from './post-to-resend';
import { toResendPayload } from './to-resend-payload';

export const sendEmail = async (
  email: OutgoingEmail,
  idempotencyKey?: string,
): Promise<EmailSendResult> => {
  const result = await postToResend({
    path: '/emails',
    body: toResendPayload(email),
    idempotencyKey,
  });

  if (!result.ok) {
    return result;
  }

  const id = (result.body as { id?: unknown } | null)?.id;

  return { ok: true, id: typeof id === 'string' ? id : '' };
};
