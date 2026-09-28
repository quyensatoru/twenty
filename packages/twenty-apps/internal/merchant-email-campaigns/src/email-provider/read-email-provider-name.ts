import { EMAIL_PROVIDER_VARIABLE } from '../constants/application-variable-names';
import { type EmailProviderName } from '../types/email-provider-name';

export const readEmailProviderName = (): EmailProviderName =>
  process.env[EMAIL_PROVIDER_VARIABLE]?.trim().toUpperCase() === 'CUSTOM_HTTP'
    ? 'CUSTOM_HTTP'
    : 'RESEND';
