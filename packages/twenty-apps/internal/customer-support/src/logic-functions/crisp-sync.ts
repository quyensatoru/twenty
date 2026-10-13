import { defineLogicFunction } from 'twenty-sdk/define';

import { CRISP_SYNC_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type CrispSyncJobPayload,
  runCrispSyncJob,
} from './utils/run-crisp-sync-job.util';

const handler = async (payload: CrispSyncJobPayload) =>
  runCrispSyncJob(payload);

export default defineLogicFunction({
  universalIdentifier: CRISP_SYNC_LOGIC_FUNCTION_UID,
  name: 'crisp-sync',
  description:
    'Job: copies Crisp conversations updated since a date, resuming itself until every website is done.',
  timeoutSeconds: 600,
  handler,
});
