import { type OutgoingEmail } from '../types/outgoing-email';
import { parseSenderAddress } from './parse-sender-address.util';

export const buildCustomEmailTemplateValues = (
  email: OutgoingEmail,
  idempotencyKey?: string,
): Record<string, string | undefined> => {
  const sender = parseSenderAddress(email.from);

  return {
    ...email.context,
    to: email.to,
    from: email.from,
    fromEmail: sender.email,
    fromName: sender.name,
    replyTo: email.replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
    idempotencyKey,
  };
};
