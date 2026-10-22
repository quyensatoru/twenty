import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ESTIMATE_MANUAL_AUDIENCE_ROUTE_PATH } from '../constants/route-paths';
import { ESTIMATE_MANUAL_AUDIENCE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { readErrorMessage } from '../utils/read-error-message.util';
import { fetchMerchantsByEmail } from './utils/fetch-merchants-by-email.util';
import { fetchSuppressedEmails } from './utils/fetch-suppressed-emails.util';
import { createAppClient } from './utils/create-app-client.util';

type EstimateManualAudienceBody = { emails?: string[]; appIds?: string[] };

// Counted server-side, same as the audience filter's own estimate: only the
// server can see merchant unsubscribe status and the suppression list, so a
// client-side count of "valid-looking addresses" is not the real number that
// will be mailed.
const handler = async (event: RoutePayload<EstimateManualAudienceBody>) => {
  try {
    const emails = [
      ...new Set((event.body?.emails ?? []).map((email) => email.trim().toLowerCase()).filter((email) => email !== '')),
    ];
    const appIds = event.body?.appIds ?? [];
    const client = createAppClient();

    const [{ byEmail: merchantsByEmail, ambiguousEmails }, suppressedEmails] =
      await Promise.all([
        fetchMerchantsByEmail(client, emails, appIds),
        fetchSuppressedEmails(client, emails),
      ]);

    let willSend = 0;
    let skippedUnsubscribed = 0;
    let matchedMerchants = 0;

    for (const email of emails) {
      const merchant = merchantsByEmail.get(email);

      if (merchant !== undefined) {
        matchedMerchants += 1;

        if (merchant.emailUnsubscribed === true) {
          skippedUnsubscribed += 1;
          continue;
        }
      } else if (suppressedEmails.has(email)) {
        skippedUnsubscribed += 1;
        continue;
      }

      willSend += 1;
    }

    return {
      success: true,
      totalProvided: emails.length,
      willSend,
      skippedUnsubscribed,
      matchedMerchants,
      ambiguousCount: ambiguousEmails.size,
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: ESTIMATE_MANUAL_AUDIENCE_LOGIC_FUNCTION_UID,
  name: 'estimate-manual-audience',
  description:
    'Route: checks a manual recipient list against merchant records and the suppression list.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ESTIMATE_MANUAL_AUDIENCE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
