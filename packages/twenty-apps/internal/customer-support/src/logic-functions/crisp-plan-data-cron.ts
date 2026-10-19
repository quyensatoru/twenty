import { defineLogicFunction } from 'twenty-sdk/define';
import { enqueueJobs } from 'twenty-sdk/logic-function';

import {
  CRISP_PLAN_DATA_CRON_LOGIC_FUNCTION_UID,
  CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID,
} from '../constants/universal-identifiers';

// Merchant changes and new chats are written as they happen. The sweep is
// the one-off fill at go-live: started by hand, then resumed here each day
// within the day's budget until every chat is done, and not started again.
// Run it by hand with { "startCycle": true } to go over every chat again.
const handler = async () => {
  await enqueueJobs({
    logicFunctionUniversalIdentifier: CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID,
    payloads: [{ startCycle: false }],
    retryLimit: 1,
  });

  return { queued: true };
};

export default defineLogicFunction({
  universalIdentifier: CRISP_PLAN_DATA_CRON_LOGIC_FUNCTION_UID,
  name: 'crisp-plan-data-cron',
  description:
    'Daily cron: resumes the plan data sweep of every chat in Crisp, if one is in progress.',
  timeoutSeconds: 60,
  cronTriggerSettings: {
    pattern: '0 3 * * *',
  },
  handler,
});
