import { defineLogicFunction } from 'twenty-sdk/define';

import { CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { runPlanDataSweep } from './utils/run-plan-data-sweep.util';

// Run by hand with { "startCycle": true } to start a sweep before the next
// daily cron; a continuation only resumes the sweep in progress.
const handler = async (payload: { startCycle?: boolean } | undefined) =>
  runPlanDataSweep({ startCycle: payload?.startCycle === true });

export default defineLogicFunction({
  universalIdentifier: CRISP_PLAN_DATA_SWEEP_LOGIC_FUNCTION_UID,
  name: 'crisp-plan-data-sweep',
  description:
    "Job: writes the merchant's plan and plan start into the session data of every chat in Crisp, including chats the CRM never stored, within a daily request budget.",
  timeoutSeconds: 600,
  handler,
});
