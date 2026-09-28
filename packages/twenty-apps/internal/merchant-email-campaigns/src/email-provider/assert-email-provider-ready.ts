import { readCustomEmailConfig } from '../custom-http-client/read-custom-email-config';
import { readResendApiKey } from '../resend-client/read-resend-api-key';
import { readEmailProviderName } from './read-email-provider-name';

export const assertEmailProviderReady = (): void => {
  if (readEmailProviderName() === 'CUSTOM_HTTP') {
    readCustomEmailConfig();

    return;
  }

  readResendApiKey();
};
