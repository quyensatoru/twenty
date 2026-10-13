import { defineLogicFunction } from 'twenty-sdk/define';

import { CRISP_SYNC_CRON_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  buildCatchUpPayload,
  runCrispSyncJob,
} from './utils/run-crisp-sync-job.util';

// The web hook is the live path; this hourly pass picks up what it missed
// (a delivery Crisp gave up on, a pause of the sync, an outage on our side).
const handler = async () => runCrispSyncJob(await buildCatchUpPayload());

export default defineLogicFunction({
  universalIdentifier: CRISP_SYNC_CRON_LOGIC_FUNCTION_UID,
  name: 'crisp-sync-cron',
  description:
    'Hourly cron: catches up Crisp conversations updated since the last successful sync.',
  timeoutSeconds: 600,
  cronTriggerSettings: {
    pattern: '17 * * * *',
  },
  handler,
});
