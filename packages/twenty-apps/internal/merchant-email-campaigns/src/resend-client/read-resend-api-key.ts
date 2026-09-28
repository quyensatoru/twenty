import { RESEND_API_KEY_VARIABLE } from '../constants/application-variable-names';

export const readResendApiKey = (): string => {
  const apiKey = process.env[RESEND_API_KEY_VARIABLE]?.trim();

  if (apiKey === undefined || apiKey === '') {
    throw new Error(
      'RESEND_API_KEY is not set. Add it in Settings > Apps > Merchant Email Campaigns.',
    );
  }

  return apiKey;
};
