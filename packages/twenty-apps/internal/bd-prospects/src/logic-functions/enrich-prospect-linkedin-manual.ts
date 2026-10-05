import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SERPER_API_KEY_VARIABLE } from '../constants/application-variable-names';
import { ENRICH_PROSPECT_LINKEDIN_MANUAL_ROUTE_PATH } from '../constants/route-paths';
import { ENRICH_PROSPECT_LINKEDIN_MANUAL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../utils/api-types';
import {
  enrichProspectsLinkedin,
  type EnrichSummary,
} from './enrich-prospect-linkedin';

type ApiClient = any;

type EnrichProspectLinkedinManualBody = {
  prospectId?: string;
  dryRun?: boolean;
};

type LinkedinStatus = {
  primaryUrl: string | null;
  primaryLabel: string | null;
  secondaryCount: number;
  checkedAt: string | null;
};

const readLinkedinStatus = async (
  client: ApiClient,
  prospectId: string,
): Promise<LinkedinStatus> => {
  const result = await client.query({
    prospects: {
      __args: { filter: { id: { eq: prospectId } }, first: 1 },
      edges: {
        node: {
          id: true,
          linkedinPage: {
            primaryLinkUrl: true,
            primaryLinkLabel: true,
            secondaryLinks: { url: true, label: true },
          },
          linkedinCheckedAt: true,
        },
      },
    },
  });

  const node = (result?.prospects as Connection<Record<string, any>>)
    ?.edges?.[0]?.node;

  if (typeof node?.id !== 'string') {
    throw new Error(`Prospect ${prospectId} not found`);
  }

  const secondaryLinks = Array.isArray(node.linkedinPage?.secondaryLinks)
    ? node.linkedinPage.secondaryLinks
    : [];

  return {
    primaryUrl: node.linkedinPage?.primaryLinkUrl ?? null,
    primaryLabel: node.linkedinPage?.primaryLinkLabel ?? null,
    secondaryCount: secondaryLinks.length,
    checkedAt: node.linkedinCheckedAt ?? null,
  };
};

// Manual entry point, for prospects that predate the cron and for verifying a
// single shop on demand. Same core as the batch; a prospectId forces a
// re-check even when freshly stamped. With dryRun it only reads the current
// LinkedIn state, which is what the record-page widget shows. No UI calls the
// re-check besides that widget, by design.
const handler = async (
  event: RoutePayload<EnrichProspectLinkedinManualBody>,
): Promise<
  ({ success: true } & EnrichSummary) | ({ success: true; dryRun: true } & LinkedinStatus)
> => {
  const client: ApiClient = new CoreApiClient();
  const prospectId =
    typeof event.body?.prospectId === 'string'
      ? event.body.prospectId
      : undefined;

  if (event.body?.dryRun === true) {
    if (typeof prospectId !== 'string') {
      throw new Error('prospectId is required for a dry run.');
    }

    return { success: true, dryRun: true, ...(await readLinkedinStatus(client, prospectId)) };
  }

  const apiKey = process.env[SERPER_API_KEY_VARIABLE]?.trim();

  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new Error(
      'SERPER_API_KEY is not set. Add it under Settings > Apps > BD Prospects > Variables.',
    );
  }

  const summary = await enrichProspectsLinkedin({
    client,
    apiKey,
    prospectId,
    // An explicit manual call always processes what it picks up, including
    // outside the re-check window.
    allowRecheck: true,
  });

  return { success: true, ...summary };
};

export default defineLogicFunction({
  universalIdentifier: ENRICH_PROSPECT_LINKEDIN_MANUAL_LOGIC_FUNCTION_UID,
  name: 'enrich-prospect-linkedin-manual',
  description:
    'Route: runs the LinkedIn enrichment once, for one prospect or the next stale batch.',
  timeoutSeconds: 600,
  httpRouteTriggerSettings: {
    path: ENRICH_PROSPECT_LINKEDIN_MANUAL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
