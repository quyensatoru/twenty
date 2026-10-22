import { createTransport } from 'nodemailer';

import {
  NOTIFICATION_EMAIL_PROVIDER_VARIABLE,
  NOTIFICATION_SMTP_FROM_VARIABLE,
  NOTIFICATION_SMTP_HOST_VARIABLE,
  NOTIFICATION_SMTP_PASSWORD_VARIABLE,
  NOTIFICATION_SMTP_PORT_VARIABLE,
  NOTIFICATION_SMTP_USERNAME_VARIABLE,
  NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE,
} from '../../constants/application-variables';
import { type NotificationEmail } from './build-notification-email.util';
import { readErrorMessage } from './read-error-message.util';

export type NotificationSendResult =
  | { ok: true }
  | { ok: false; error: string };

const readVariable = (name: string): string => process.env[name]?.trim() ?? '';

// Direct SMTP, not the core sendEmail mutation: that mutation requires a
// token bound to a workspace member, which a pure application-token logic
// function call never has, regardless of the app's own role permissions.
const sendThroughSmtp = async (
  to: string,
  email: NotificationEmail,
): Promise<NotificationSendResult> => {
  const host = readVariable(NOTIFICATION_SMTP_HOST_VARIABLE);
  const port = Number(readVariable(NOTIFICATION_SMTP_PORT_VARIABLE) || '587');
  const username = readVariable(NOTIFICATION_SMTP_USERNAME_VARIABLE);
  // Google shows app passwords in groups of four separated by spaces.
  const password = readVariable(NOTIFICATION_SMTP_PASSWORD_VARIABLE).replace(
    /\s+/g,
    '',
  );
  const from = readVariable(NOTIFICATION_SMTP_FROM_VARIABLE) || username;

  if (host.length === 0 || username.length === 0 || password.length === 0) {
    return {
      ok: false,
      error:
        'NOTIFICATION_SMTP_HOST, NOTIFICATION_SMTP_USERNAME or NOTIFICATION_SMTP_PASSWORD is not set.',
    };
  }

  const transport = createTransport({
    host,
    port,
    // Implicit TLS only below the STARTTLS cutover port; everything else
    // upgrades in-band, which is how 587 (Gmail's default) and most
    // providers run.
    secure: port === 465,
    auth: { user: username, pass: password },
  });

  try {
    await transport.sendMail({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: readErrorMessage(error) };
  }
};

const sendThroughWorkflowWebhook = async (
  to: string,
  email: NotificationEmail,
): Promise<NotificationSendResult> => {
  const webhookUrl = readVariable(NOTIFICATION_WORKFLOW_WEBHOOK_URL_VARIABLE);

  if (webhookUrl.length === 0) {
    return {
      ok: false,
      error: 'NOTIFICATION_WORKFLOW_WEBHOOK_URL is not set.',
    };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to, subject: email.subject, text: email.text }),
  });

  return response.ok
    ? { ok: true }
    : {
        ok: false,
        error: `Workflow webhook HTTP ${response.status}: ${await response.text()}`,
      };
};

const SENDER_BY_PROVIDER: Record<
  string,
  (to: string, email: NotificationEmail) => Promise<NotificationSendResult>
> = {
  WORKFLOW_WEBHOOK: sendThroughWorkflowWebhook,
};

export const sendNotificationEmail = async (
  to: string,
  email: NotificationEmail,
): Promise<NotificationSendResult> => {
  try {
    const send =
      SENDER_BY_PROVIDER[
        readVariable(NOTIFICATION_EMAIL_PROVIDER_VARIABLE).toUpperCase()
      ] ?? sendThroughSmtp;

    return await send(to, email);
  } catch (error) {
    return { ok: false, error: readErrorMessage(error) };
  }
};
