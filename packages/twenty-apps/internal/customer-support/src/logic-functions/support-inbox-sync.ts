import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SUPPORT_INBOX_SYNC_ROUTE_PATH } from '../constants/crisp';
import { SUPPORT_INBOX_SYNC_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { claimCrispWebsites } from './utils/crisp-sync-state.util';
import {
  isCrispApiConfigured,
  readCrispSettings,
} from './utils/read-crisp-settings.util';
import {
  buildCatchUpPayload,
  enqueueCrispSync,
} from './utils/run-crisp-sync-job.util';
import { runRoute } from './utils/run-route.util';

type SyncBody = {
  days?: number;
};

const MAX_BACKFILL_DAYS = 365;

// `days` re-reads that much history (the first import after setup); without it
// the run only catches up since the last sync.
const handler = async (event: RoutePayload<SyncBody>) =>
  runRoute(async () => {
    const settings = readCrispSettings();

    if (!isCrispApiConfigured(settings)) {
      throw new Error(
        'Set the Crisp plugin token and at least one website id under Settings > Apps > Customer Support > Variables first.',
      );
    }

    // Claimed right away so the web hook starts landing before the job runs.
    const claimErrors = await claimCrispWebsites(settings);

    if (claimErrors.length > 0) {
      throw new Error(claimErrors.join('; '));
    }

    const rawDays = event.body?.days;
    const days =
      typeof rawDays === 'number' && Number.isFinite(rawDays) && rawDays > 0
        ? Math.min(Math.floor(rawDays), MAX_BACKFILL_DAYS)
        : undefined;
    const payload =
      days === undefined
        ? await buildCatchUpPayload()
        : {
            updatedSince: new Date(
              Date.now() - days * 24 * 60 * 60 * 1000,
            ).toISOString(),
            runStartedAt: new Date().toISOString(),
          };

    return { queued: await enqueueCrispSync(payload) };
  });

export default defineLogicFunction({
  universalIdentifier: SUPPORT_INBOX_SYNC_LOGIC_FUNCTION_UID,
  name: 'support-inbox-sync',
  description:
    'Route: links the Crisp websites to this workspace and queues a sync, optionally re-reading N days of history.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: SUPPORT_INBOX_SYNC_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
