import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  ALERT_CONNECTED_ACCOUNT_VARIABLE,
  ALERT_FROM_EMAIL_VARIABLE,
  ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE,
  EMAIL_PROVIDER_VARIABLE,
  RESEND_API_KEY_VARIABLE,
} from '../../constants/application-variable-names';
import { type AlertEmail } from '../../utils/build-alert-email.util';
import { readErrorMessage } from './read-error-message.util';

export type AlertSendResult = { ok: true } | { ok: false; error: string };

const readVariable = (name: string): string => process.env[name]?.trim() ?? '';

const sendThroughConnectedAccount = async (
  to: string,
  email: AlertEmail,
): Promise<AlertSendResult> => {
  const connectedAccountId = readVariable(ALERT_CONNECTED_ACCOUNT_VARIABLE);

  if (connectedAccountId.length === 0) {
    return { ok: false, error: 'ALERT_CONNECTED_ACCOUNT_ID is not set.' };
  }

  const client = new MetadataApiClient({ runAs: 'application' }) as unknown as {
    mutation: (
      selection: Record<string, unknown>,
    ) => Promise<{ sendEmail?: { success?: boolean; error?: string | null } }>;
  };
  // The composer turns a plain string body into paragraphs, so the text
  // version is what goes out here; HTML would arrive as visible markup.
  const result = await client.mutation({
    sendEmail: {
      __args: {
        input: {
          connectedAccountId,
          to,
          subject: email.subject,
          body: email.text,
        },
      },
      success: true,
      error: true,
    },
  });

  return result.sendEmail?.success === true
    ? { ok: true }
    : { ok: false, error: result.sendEmail?.error ?? 'sendEmail failed' };
};

const sendThroughResend = async (
  to: string,
  email: AlertEmail,
): Promise<AlertSendResult> => {
  const apiKey = readVariable(RESEND_API_KEY_VARIABLE);
  const from = readVariable(ALERT_FROM_EMAIL_VARIABLE);

  if (apiKey.length === 0 || from.length === 0) {
    return {
      ok: false,
      error: 'RESEND_API_KEY or ALERT_FROM_EMAIL is not set.',
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  return response.ok
    ? { ok: true }
    : {
        ok: false,
        error: `Resend HTTP ${response.status}: ${await response.text()}`,
      };
};

const sendThroughWorkflowWebhook = async (
  to: string,
  email: AlertEmail,
): Promise<AlertSendResult> => {
  const webhookUrl = readVariable(ALERT_WORKFLOW_WEBHOOK_URL_VARIABLE);

  if (webhookUrl.length === 0) {
    return { ok: false, error: 'ALERT_WORKFLOW_WEBHOOK_URL is not set.' };
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
  (to: string, email: AlertEmail) => Promise<AlertSendResult>
> = {
  RESEND: sendThroughResend,
  WORKFLOW_WEBHOOK: sendThroughWorkflowWebhook,
};

export const sendAlertEmail = async (
  to: string,
  email: AlertEmail,
): Promise<AlertSendResult> => {
  try {
    const send =
      SENDER_BY_PROVIDER[readVariable(EMAIL_PROVIDER_VARIABLE).toUpperCase()] ??
      sendThroughConnectedAccount;

    return await send(to, email);
  } catch (error) {
    return { ok: false, error: readErrorMessage(error) };
  }
};
