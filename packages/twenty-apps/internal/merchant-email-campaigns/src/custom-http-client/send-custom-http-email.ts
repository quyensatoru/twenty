import { type OutgoingEmail } from '../types/outgoing-email';
import { type EmailSendResult } from '../types/email-send-result';
import { buildCustomEmailTemplateValues } from '../utils/build-custom-email-template-values.util';
import { readProviderMessageId } from '../utils/read-provider-message-id.util';
import { renderJsonTemplate } from '../utils/render-json-template.util';
import { readCustomEmailConfig } from './read-custom-email-config';

// Any 2xx counts as accepted. 429 and 5xx are retried, like Resend.
export const sendCustomHttpEmail = async (
  email: OutgoingEmail,
  idempotencyKey?: string,
): Promise<EmailSendResult> => {
  const { endpoint, headers, bodyTemplate } = readCustomEmailConfig();
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(
        renderJsonTemplate(
          bodyTemplate,
          buildCustomEmailTemplateValues(email, idempotencyKey),
        ),
      ),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      isRetryable: true,
    };
  }

  const text = await response.text();
  const body = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  })();

  if (response.ok) {
    return { ok: true, id: readProviderMessageId(body) };
  }

  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message: unknown }).message)
      : `Email service responded ${response.status}${typeof body === 'string' && body ? `: ${body.slice(0, 200)}` : ''}`;

  return {
    ok: false,
    error: message,
    isRetryable: response.status === 429 || response.status >= 500,
  };
};
