import { defineLogicFunction } from 'twenty-sdk/define';

import { FOLLOW_UP_SWEEP_CRON_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type BcIssueRecord, type VipClientRecord } from '../types/bc-records';
import { remindUnresolvedIssue } from './utils/automation-issue-reminder.util';
import { createAppClient } from './utils/create-app-client.util';
import { listAllRecords } from './utils/list-all-records.util';
import { readErrorMessage } from './utils/read-error-message.util';
import { recomputeClientStatus } from './utils/recompute-client-status.util';
import {
  BC_ISSUE_SELECTION,
  VIP_CLIENT_SELECTION,
} from './utils/record-selections';

const RUN_BUDGET_MS = 100_000;

// Time alone moves a client from Waiting for Client to Follow-up, and time
// alone makes an open issue due for its weekly reminder; no event fires for
// either, so this sweep handles both.
const handler = async () => {
  const startedAt = Date.now();
  const client = createAppClient();
  const waiting = await listAllRecords<VipClientRecord>({
    client,
    pluralName: 'vipClients',
    filter: {
      awaitingReplySince: { is: 'NOT_NULL' },
      relationshipStatus: { neq: 'FOLLOW_UP' },
    },
    selection: VIP_CLIENT_SELECTION,
    orderBy: [{ awaitingReplySince: 'AscNullsLast' }],
  });
  let changed = 0;
  const errors: { vipClientId: string; error: string }[] = [];

  for (const vipClient of waiting) {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
      break;
    }

    try {
      const result = await recomputeClientStatus({ client, vipClientId: vipClient.id });

      changed += result.hasChanged ? 1 : 0;
    } catch (error) {
      errors.push({ vipClientId: vipClient.id, error: readErrorMessage(error) });
    }
  }

  const openIssues = await listAllRecords<BcIssueRecord>({
    client,
    pluralName: 'bcIssues',
    filter: { status: { eq: 'OPEN' } },
    selection: BC_ISSUE_SELECTION,
    orderBy: [{ detectedAt: 'AscNullsLast' }],
  });
  const now = new Date().toISOString();
  let reminded = 0;

  for (const issue of openIssues) {
    if (Date.now() - startedAt > RUN_BUDGET_MS) {
      break;
    }

    try {
      reminded += (await remindUnresolvedIssue({ client, issue, now })) ? 1 : 0;
    } catch (error) {
      errors.push({ vipClientId: issue.vipClientId ?? issue.id, error: readErrorMessage(error) });
    }
  }

  return { waiting: waiting.length, changed, openIssues: openIssues.length, reminded, errors };
};

export default defineLogicFunction({
  universalIdentifier: FOLLOW_UP_SWEEP_CRON_LOGIC_FUNCTION_UID,
  name: 'follow-up-sweep-cron',
  description:
    'Hourly: moves VIP clients that left a BC message unanswered past the no-reply window to Follow-up with one follow-up task each, and adds a weekly reminder to the task of every issue still open.',
  timeoutSeconds: 120,
  cronTriggerSettings: {
    pattern: '0 * * * *',
  },
  handler,
});
