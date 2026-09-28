import {
  type ApplicationHealthCheckResult,
  ApplicationHealthStatus,
  defineHealthCheck,
} from 'twenty-sdk/define';

import {
  DEFAULT_FROM_EMAIL_VARIABLE,
  INBOUND_EVENTS_API_KEY_VARIABLE,
  RESEND_API_KEY_VARIABLE,
} from '../constants/application-variable-names';
import { HEALTH_CHECK_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readCustomEmailConfig } from '../custom-http-client/read-custom-email-config';
import { readEmailProviderName } from '../email-provider/read-email-provider-name';
import { RESEND_API_BASE_URL } from '../resend-client/resend-api-base-url';
import { readErrorMessage } from '../utils/read-error-message.util';

const openVariables = { label: 'Open variables', location: '#variables' };

const checkResend = async (): Promise<ApplicationHealthCheckResult | null> => {
  const apiKey = process.env[RESEND_API_KEY_VARIABLE]?.trim();

  if (!apiKey) {
    return {
      status: ApplicationHealthStatus.ERROR,
      title: 'Resend is not connected',
      description:
        'Add a Resend API key, or switch EMAIL_PROVIDER to CUSTOM_HTTP.',
      action: openVariables,
    };
  }

  const response = await fetch(`${RESEND_API_BASE_URL}/domains`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  // A sending-only key cannot list domains and answers 401 with a
  // restricted-key message, which still proves the key is valid.
  if (response.status === 401 && !/restricted/i.test(await response.text())) {
    return {
      status: ApplicationHealthStatus.ERROR,
      title: 'Resend rejected the API key',
      description: 'Create a new key in Resend and update RESEND_API_KEY.',
      action: openVariables,
    };
  }

  if (!response.ok && response.status !== 401) {
    return {
      status: ApplicationHealthStatus.WARNING,
      title: 'Resend did not answer',
      description: `Resend responded ${response.status}.`,
    };
  }

  return null;
};

export default defineHealthCheck({
  universalIdentifier: HEALTH_CHECK_LOGIC_FUNCTION_UID,
  handler: async (): Promise<ApplicationHealthCheckResult> => {
    if (readEmailProviderName() === 'CUSTOM_HTTP') {
      try {
        readCustomEmailConfig();
      } catch (error) {
        return {
          status: ApplicationHealthStatus.ERROR,
          title: 'Custom email service is not configured',
          description: readErrorMessage(error),
          action: openVariables,
        };
      }
    } else {
      const resendProblem = await checkResend();

      if (resendProblem !== null) {
        return resendProblem;
      }
    }

    if (!process.env[DEFAULT_FROM_EMAIL_VARIABLE]?.trim()) {
      return {
        status: ApplicationHealthStatus.WARNING,
        title: 'No default sender',
        description:
          'Set DEFAULT_FROM_EMAIL, or every campaign needs its own From address.',
        action: openVariables,
      };
    }

    if (!process.env[INBOUND_EVENTS_API_KEY_VARIABLE]?.trim()) {
      return {
        status: ApplicationHealthStatus.INFO,
        title: 'Inbound events are off',
        description:
          'Set INBOUND_EVENTS_API_KEY to let other apps post events.',
        action: openVariables,
      };
    }

    return { status: 'OK' };
  },
});
