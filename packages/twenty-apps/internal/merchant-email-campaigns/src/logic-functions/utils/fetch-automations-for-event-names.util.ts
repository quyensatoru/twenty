import { CAMPAIGN_SELECTION } from '../../constants/campaign-selection';
import { type ApiClient } from '../../types/api-client';
import { type CampaignRow } from '../../types/campaign-row';
import { type Connection } from '../../types/connection';
import { buildEventNameQuery } from '../../utils/build-event-name-query.util';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { selectCampaignsForEventNames } from '../../utils/select-campaigns-for-event-names.util';

const MAX_AUTOMATIONS = 100;

export const fetchAutomationsForEventNames = async (
  client: ApiClient,
  eventNames: string[],
): Promise<CampaignRow[]> => {
  const query = buildEventNameQuery(eventNames);

  if (query.eventNames.length === 0) {
    return [];
  }

  const { emailCampaigns } = await executeWithRetry<{
    emailCampaigns: Connection<CampaignRow>;
  }>(() =>
    client.query({
      emailCampaigns: {
        __args: {
          filter: {
            and: [
              { campaignType: { eq: 'AUTOMATION' } },
              { status: { eq: 'ACTIVE' } },
              {
                or: [
                  { eventName: { in: query.eventNames } },
                  ...(query.legacyTriggers.length === 0
                    ? []
                    : [{ trigger: { in: query.legacyTriggers } }]),
                ],
              },
            ],
          },
          first: MAX_AUTOMATIONS,
        },
        edges: { node: CAMPAIGN_SELECTION },
      },
    }),
  );

  return selectCampaignsForEventNames(
    (emailCampaigns?.edges ?? []).map((edge) => edge.node),
    eventNames,
  );
};
