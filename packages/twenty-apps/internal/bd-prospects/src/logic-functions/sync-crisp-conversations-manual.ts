import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { SYNC_CRISP_MANUAL_ROUTE_PATH } from '../constants/route-paths';
import { SYNC_CRISP_MANUAL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  readCrispCredentials,
  readCrispSettings,
  resolveCrispWebsiteIds,
} from '../utils/read-crisp-settings';
import {
  syncCrispConversations,
  type CrispSyncSummary,
} from './sync-crisp-conversations';

type ApiClient = any;

type SyncCrispManualBody = {
  prospectId?: string;
  limit?: number;
};

// Manual entry point for the first backfill and for verifying a single shop on
// demand. Same core as the daily batch; a prospectId forces a re-check even
// when freshly stamped, otherwise the next stale batch runs. No UI calls this,
// by design: the portal only reads the synced columns.
const handler = async (
  event: RoutePayload<SyncCrispManualBody>,
): Promise<{ success: true } & CrispSyncSummary> => {
  const settings = readCrispSettings();

  if (resolveCrispWebsiteIds({ settings }).length === 0) {
    throw new Error(
      'No Crisp website is configured. Add CRISP_WEBSITE_ID_BLOY, CRISP_WEBSITE_ID_MIDA or the CRISP_WEBSITE_ID fallback under Settings > Apps > BD Prospects > Variables.',
    );
  }

  const credentials = readCrispCredentials();
  const client: ApiClient = new CoreApiClient();
  const prospectId =
    typeof event.body?.prospectId === 'string'
      ? event.body.prospectId
      : undefined;
  const rawLimit = event.body?.limit;
  const writeLimit =
    typeof rawLimit === 'number' && Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.floor(rawLimit)
      : undefined;

  const summary = await syncCrispConversations({
    client,
    credentials,
    settings,
    prospectId,
    writeLimit,
  });

  return { success: true, ...summary };
};

export default defineLogicFunction({
  universalIdentifier: SYNC_CRISP_MANUAL_LOGIC_FUNCTION_UID,
  name: 'sync-crisp-conversations-manual',
  description:
    'Route: runs the Crisp sync once, for one prospect or the next stale batch.',
  timeoutSeconds: 600,
  httpRouteTriggerSettings: {
    path: SYNC_CRISP_MANUAL_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
