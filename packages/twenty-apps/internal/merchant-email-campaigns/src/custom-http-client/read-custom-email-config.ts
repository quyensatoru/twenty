import {
  CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE,
  CUSTOM_EMAIL_ENDPOINT_VARIABLE,
  CUSTOM_EMAIL_HEADERS_VARIABLE,
} from '../constants/application-variable-names';
import { DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE } from '../constants/default-custom-email-body-template';
import { type CustomEmailConfig } from '../types/custom-email-config';

const parseJsonVariable = (name: string, raw: string | undefined): unknown => {
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${name} is not valid JSON.`);
  }
};

// Throws with a message meant for the member who clicked, since this is read
// right before a send and a broken config should stop it there.
export const readCustomEmailConfig = (): CustomEmailConfig => {
  const endpoint = process.env[CUSTOM_EMAIL_ENDPOINT_VARIABLE]?.trim() ?? '';

  if (!/^https?:\/\//i.test(endpoint)) {
    throw new Error(
      'CUSTOM_EMAIL_ENDPOINT must be an http(s) URL when EMAIL_PROVIDER is CUSTOM_HTTP.',
    );
  }

  const headers = parseJsonVariable(
    CUSTOM_EMAIL_HEADERS_VARIABLE,
    process.env[CUSTOM_EMAIL_HEADERS_VARIABLE],
  );

  if (
    headers !== undefined &&
    (typeof headers !== 'object' ||
      headers === null ||
      Array.isArray(headers) ||
      Object.values(headers).some((value) => typeof value !== 'string'))
  ) {
    throw new Error(
      'CUSTOM_EMAIL_HEADERS must be a JSON object of string values.',
    );
  }

  const bodyTemplate = parseJsonVariable(
    CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE,
    process.env[CUSTOM_EMAIL_BODY_TEMPLATE_VARIABLE],
  );

  return {
    endpoint,
    headers: (headers as Record<string, string> | undefined) ?? {},
    bodyTemplate: bodyTemplate ?? DEFAULT_CUSTOM_EMAIL_BODY_TEMPLATE,
  };
};
