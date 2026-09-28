import { type OutgoingEmail } from '../types/outgoing-email';

export const toResendPayload = (
  email: OutgoingEmail,
): Record<string, unknown> => ({
  from: email.from,
  to: [email.to],
  subject: email.subject,
  html: email.html,
  text: email.text,
  ...(email.replyTo === undefined ? {} : { reply_to: email.replyTo }),
  ...(email.headers === undefined ? {} : { headers: email.headers }),
  ...(email.tags === undefined ? {} : { tags: email.tags }),
});
