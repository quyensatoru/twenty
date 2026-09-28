import {
  RESEND_API_KEY_VARIABLE,
  UNSUBSCRIBE_SECRET_VARIABLE,
} from '../../constants/application-variable-names';

// Falls back to the Resend key so unsubscribe links work before anyone sets a
// dedicated secret. Setting UNSUBSCRIBE_SECRET later invalidates old links,
// which is why the README says to set it before the first send.
export const readUnsubscribeSecret = (): string => {
  const secret =
    process.env[UNSUBSCRIBE_SECRET_VARIABLE]?.trim() ||
    process.env[RESEND_API_KEY_VARIABLE]?.trim();

  if (secret === undefined || secret === '') {
    throw new Error(
      'Neither UNSUBSCRIBE_SECRET nor RESEND_API_KEY is set on the app.',
    );
  }

  return secret;
};
