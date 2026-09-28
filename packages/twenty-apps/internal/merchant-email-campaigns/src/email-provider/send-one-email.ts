import { sendCustomHttpEmail } from '../custom-http-client/send-custom-http-email';
import { sendEmail as sendResendEmail } from '../resend-client/send-email';
import { withSendRetry } from './with-send-retry';
import { type OutgoingEmail } from '../types/outgoing-email';
import { type EmailSendResult } from '../types/email-send-result';
import { readEmailProviderName } from './read-email-provider-name';

export const sendOneEmail = (
  email: OutgoingEmail,
  idempotencyKey?: string,
): Promise<EmailSendResult> =>
  withSendRetry(() =>
    readEmailProviderName() === 'CUSTOM_HTTP'
      ? sendCustomHttpEmail(email, idempotencyKey)
      : sendResendEmail(email, idempotencyKey),
  );
