import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PREVIEW_AUDIENCE_ROUTE_PATH } from '../constants/route-paths';
import { PREVIEW_AUDIENCE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { parseAudienceFilter } from '../utils/parse-audience-filter.util';
import { readErrorMessage } from '../utils/read-error-message.util';
import { readMerchantEmail } from '../utils/read-merchant-email.util';
import { fetchMerchantPage } from './utils/fetch-merchant-page.util';
import { createAppClient } from './utils/create-app-client.util';

const SAMPLE_SIZE = 10;

// Counted server-side with the same filter the broadcast uses and under the
// app's own role, so the number matches what will actually be sent even for a
// member whose app access hides some merchants.
const handler = async (event: RoutePayload<{ audienceFilter?: unknown }>) => {
  try {
    const page = await fetchMerchantPage({
      client: createAppClient(),
      audienceFilter: parseAudienceFilter(event.body?.audienceFilter),
      first: SAMPLE_SIZE,
    });

    return {
      success: true,
      totalCount: page.totalCount ?? 0,
      sample: (page.edges ?? []).map(({ node }) => ({
        id: node.id,
        name: node.name ?? '',
        email: readMerchantEmail(node) ?? '',
        appName: node.app?.name ?? '',
      })),
    };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};

export default defineLogicFunction({
  universalIdentifier: PREVIEW_AUDIENCE_LOGIC_FUNCTION_UID,
  name: 'preview-campaign-audience',
  description:
    'Route: counts the merchants an audience filter reaches and returns a sample.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: PREVIEW_AUDIENCE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
