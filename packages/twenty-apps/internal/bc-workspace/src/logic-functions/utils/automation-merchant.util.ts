import { type ApiClient } from '../../types/api-client';
import {
  type MerchantRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import {
  classifyPlanChange,
  computeMrrDelta,
} from '../../utils/automation-plan.util';
import { recordActivity } from './activity-store.util';
import { listPlanCatalog } from './automation-records.util';
import { recordSubscriptionChange } from './automation-subscription.util';
import { readVipClient } from './client-store.util';

export type MerchantSnapshot = {
  pricingPlan?: string | null;
  using?: boolean | null;
  vipClientId?: string | null;
  updatedAt?: string | null;
  planStartedAt?: string | null;
};

const toMinute = (value: string): string => value.slice(0, 16);

// Plan and install changes the CRM merchant sync writes, turned into the
// verified subscription events analytics and retention tasks rely on.
export const applyMerchantChange = async ({
  client,
  merchant,
  before,
  after,
}: {
  client: ApiClient;
  merchant: MerchantRecord;
  before: MerchantSnapshot;
  after: MerchantSnapshot;
}): Promise<string[]> => {
  if (merchant.vipClientId === null) {
    return [];
  }

  const vipClient: VipClientRecord | null = await readVipClient(client, merchant.vipClientId);

  if (vipClient === null) {
    return [];
  }

  const appName = merchant.app?.name ?? null;
  // The plan clock the product sync writes is when the change took effect;
  // the row's updatedAt is only when the CRM heard of it.
  const occurredAt =
    after.planStartedAt ?? after.updatedAt ?? new Date().toISOString();
  const outcomes: string[] = [];
  const oldPlan = before.pricingPlan ?? null;
  const newPlan = after.pricingPlan ?? null;
  const wasUsing = before.using !== false;
  const isUsing = after.using !== false;

  if (before.using !== undefined && wasUsing !== isUsing) {
    const eventType = isUsing ? 'REINSTALL' : 'UNINSTALL';
    const plans = await listPlanCatalog(client);
    const fromPlan = isUsing ? null : (oldPlan ?? newPlan);
    const toPlan = isUsing ? newPlan : null;

    await recordSubscriptionChange(client, {
      vipClient,
      merchantId: merchant.id,
      appName,
      eventType,
      oldPlan: fromPlan,
      newPlan: toPlan,
      occurredAt,
      mrrDelta: computeMrrDelta({ plans, appName, oldPlan: fromPlan, newPlan: toPlan }),
      source: 'CRM_SYNC',
    });
    outcomes.push(eventType);
  }

  if (before.pricingPlan !== undefined && oldPlan !== newPlan && isUsing) {
    const plans = await listPlanCatalog(client);
    const eventType = classifyPlanChange({ plans, appName, oldPlan, newPlan });

    if (eventType === null) {
      await recordActivity(client, {
        vipClientId: vipClient.id,
        type: 'SUBSCRIPTION',
        title: `${appName ?? 'App'} plan changed (${oldPlan ?? '—'} → ${newPlan ?? '—'})`,
        summary: 'Not classified as upgrade or downgrade: the plans are missing from the plan catalog.',
        direction: 'INTERNAL',
        occurredAt,
        appName,
        externalId: `crm:plan-change:${merchant.id}:${oldPlan}:${newPlan}:${toMinute(occurredAt)}`,
      });
      outcomes.push('UNCLASSIFIED_PLAN_CHANGE');
    } else {
      await recordSubscriptionChange(client, {
        vipClient,
        merchantId: merchant.id,
        appName,
        eventType,
        oldPlan,
        newPlan,
        occurredAt,
        mrrDelta: computeMrrDelta({ plans, appName, oldPlan, newPlan }),
        source: 'CRM_SYNC',
      });
      outcomes.push(eventType);
    }
  }

  return outcomes;
};
