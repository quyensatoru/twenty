import { defineLogicFunction } from 'twenty-sdk/define';

import { SYNC_MERCHANT_PLAN_DATA_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { syncMerchantPlanData } from './utils/sync-conversation-plan-data.util';

type SyncMerchantPlanDataPayload = {
  merchantId?: string;
  dryRun?: boolean;
};

// Run by hand: { "merchantId": "…", "dryRun": true } lists the shop's chats
// in Crisp and what would change, without writing anything.
const handler = async (payload: SyncMerchantPlanDataPayload | undefined) =>
  payload?.merchantId === undefined
    ? { skipped: 'merchantId is required' }
    : syncMerchantPlanData(payload.merchantId, {
        dryRun: payload.dryRun === true,
      });

export default defineLogicFunction({
  universalIdentifier: SYNC_MERCHANT_PLAN_DATA_LOGIC_FUNCTION_UID,
  name: 'sync-merchant-plan-data',
  description:
    "Writes one merchant's plan and plan start into the session data of every chat of its shop in Crisp; a dry run only reports what would change.",
  timeoutSeconds: 300,
  handler,
});
