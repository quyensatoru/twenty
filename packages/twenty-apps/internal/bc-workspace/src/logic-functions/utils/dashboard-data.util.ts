import { type ApiClient } from '../../types/api-client';
import {
  type BcPlanRecord,
  type BcReviewRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import {
  buildPlanKey,
  type MerchantConversation,
  type PlanCatalog,
} from '../../utils/dashboard-rows.util';
import { listByVipClientIds } from './client-store.util';
import { listAllRecords } from './list-all-records.util';
import { BC_PLAN_SELECTION, BC_REVIEW_SELECTION } from './record-selections';
import { assertCanSeeClient } from './resolve-bc-scope.util';

// BCs act on the clients they own; managers and admins on any client they
// can see, unassigned ones included.
export const assertCanEditClient = (
  scope: BcScope,
  vipClient: Pick<VipClientRecord, 'picId' | 'teamId'>,
): void => {
  assertCanSeeClient(scope, vipClient.picId, vipClient.teamId);

  if (scope.role === 'BC' && vipClient.picId !== scope.workspaceMemberId) {
    throw new Error('Not authorized: only the PIC of this client can change it.');
  }

  if (scope.role === 'NONE') {
    throw new Error('Not authorized: you are not in a BC team.');
  }
};

export const canEditClient = (
  scope: BcScope,
  vipClient: Pick<VipClientRecord, 'picId' | 'teamId'>,
): boolean => {
  try {
    assertCanEditClient(scope, vipClient);

    return true;
  } catch {
    return false;
  }
};

export const loadPlanCatalog = async (client: ApiClient): Promise<PlanCatalog> => {
  const plans = await listAllRecords<BcPlanRecord>({
    client,
    pluralName: 'bcPlans',
    selection: BC_PLAN_SELECTION,
  });
  const catalog: PlanCatalog = new Map();

  for (const plan of plans) {
    if (plan.appName !== null && plan.planCode !== null) {
      catalog.set(buildPlanKey(plan.appName, plan.planCode), {
        appName: plan.appName,
        planCode: plan.planCode,
        label: plan.name ?? plan.planCode,
        rank: plan.rank,
        isTrial: plan.isTrial === true,
        monthlyPrice: plan.monthlyPrice,
      });
    }
  }

  return catalog;
};

type SubscriptionHistoryNode = {
  merchantId: string | null;
  appName: string | null;
  eventType: string | null;
  oldPlan: string | null;
};

// Merchants that once paid: a downgrade or cancel event, or a change away
// from a plan the catalog prices above zero. A free plan on one of them reads
// as a cancelled subscription.
export const loadPaidMerchantIds = async (
  client: ApiClient,
  merchantIds: string[],
  planCatalog: PlanCatalog,
): Promise<Set<string>> => {
  const paid = new Set<string>();

  for (let index = 0; index < merchantIds.length; index += 200) {
    const events = await listAllRecords<SubscriptionHistoryNode>({
      client,
      pluralName: 'bcSubscriptionEvents',
      filter: { merchantId: { in: merchantIds.slice(index, index + 200) } },
      selection: { merchantId: true, appName: true, eventType: true, oldPlan: true },
    });

    for (const event of events) {
      if (event.merchantId === null) {
        continue;
      }

      const oldPlanPrice =
        event.appName === null || event.oldPlan === null
          ? null
          : (planCatalog.get(buildPlanKey(event.appName, event.oldPlan))?.monthlyPrice ?? null);

      if (
        event.eventType === 'DOWNGRADE' ||
        event.eventType === 'CANCEL' ||
        (oldPlanPrice !== null && oldPlanPrice > 0)
      ) {
        paid.add(event.merchantId);
      }
    }
  }

  return paid;
};

export const listClientReviews = (
  client: ApiClient,
  vipClientIds: string[] | null,
): Promise<BcReviewRecord[]> =>
  listByVipClientIds<BcReviewRecord>({
    client,
    pluralName: 'bcReviews',
    vipClientIds,
    selection: BC_REVIEW_SELECTION,
  });

// The newest Crisp chat of each app install, for the per-app "View chat".
export const loadLatestConversationByMerchant = async (
  client: ApiClient,
  merchantIds: string[],
): Promise<Map<string, MerchantConversation>> => {
  const latest = new Map<string, MerchantConversation>();

  for (let index = 0; index < merchantIds.length; index += 200) {
    const conversations = await listAllRecords<MerchantConversation>({
      client,
      pluralName: 'crispConversations',
      filter: { merchantId: { in: merchantIds.slice(index, index + 200) } },
      selection: {
        id: true,
        merchantId: true,
        lastMessageAt: true,
        lastMessageExcerpt: true,
        websiteId: true,
        sessionId: true,
      },
      orderBy: [{ lastMessageAt: 'DescNullsLast' }],
    });

    for (const conversation of conversations) {
      if (conversation.merchantId !== null && !latest.has(conversation.merchantId)) {
        latest.set(conversation.merchantId, conversation);
      }
    }
  }

  return latest;
};
