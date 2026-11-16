import { type ApiClient } from '../../types/api-client';
import {
  type RelationshipStatus,
  type VipClientRecord,
} from '../../types/bc-records';
import {
  computeRelationshipStatus,
  readSubscriptionLifecycle,
} from '../../utils/client-status.util';
import { buildPlanKey } from '../../utils/dashboard-rows.util';
import { buildNoReplyTaskKey } from '../../utils/trigger-keys.util';
import { recordActivity } from './activity-store.util';
import { upsertAutoTask } from './auto-task.util';
import {
  listClientMerchants,
  listOpenIssues,
  readVipClient,
} from './client-store.util';
import {
  loadPaidMerchantIds,
  loadPlanCatalog,
} from './dashboard-data.util';
import { readBcSettings } from './read-bc-settings.util';
import { updateRecord } from './record-store.util';

const STATUS_LABELS: Record<RelationshipStatus, string> = {
  ACTIVE: 'Active',
  WAITING_FOR_CLIENT: 'Waiting for Client',
  FOLLOW_UP: 'Follow-up',
  AT_RISK: 'At Risk',
  INACTIVE: 'Inactive',
};

// The single place a client's overall status changes. Every event that can
// move it (issue opened or closed, BC message, client reply, app uninstall,
// the hourly sweep) calls this instead of setting the status itself.
export const recomputeClientStatus = async ({
  client,
  vipClientId,
  actorMemberId = null,
  now = new Date().toISOString(),
}: {
  client: ApiClient;
  vipClientId: string;
  actorMemberId?: string | null;
  now?: string;
}): Promise<{
  vipClient: VipClientRecord | null;
  status: RelationshipStatus | null;
  hasChanged: boolean;
}> => {
  const vipClient = await readVipClient(client, vipClientId);

  if (vipClient === null) {
    return { vipClient: null, status: null, hasChanged: false };
  }

  const settings = readBcSettings();
  const [rawMerchants, openIssues, planCatalog] = await Promise.all([
    listClientMerchants(client, [vipClientId]),
    listOpenIssues(client, [vipClientId]),
    loadPlanCatalog(client),
  ]);
  // Same lifecycle the dashboard shows, so a client whose apps are all
  // cancelled (installed on a free plan after paying) turns Inactive.
  const paidMerchantIds = await loadPaidMerchantIds(
    client,
    rawMerchants.map((merchant) => merchant.id),
    planCatalog,
  );
  const merchants = rawMerchants.map((merchant) => ({
    ...merchant,
    lifecycle: readSubscriptionLifecycle(merchant, {
      plan:
        merchant.app?.name && merchant.pricingPlan
          ? (planCatalog.get(buildPlanKey(merchant.app.name, merchant.pricingPlan)) ?? null)
          : null,
      hadPaidPlan: paidMerchantIds.has(merchant.id),
    }),
  }));
  const status = computeRelationshipStatus({
    openIssueCount: openIssues.length,
    merchants,
    awaitingReplySince: vipClient.awaitingReplySince,
    now,
    noReplyHours: settings.noReplyHours,
  });

  if (status === 'FOLLOW_UP' && vipClient.awaitingReplySince !== null) {
    await upsertAutoTask(client, {
      triggerKey: buildNoReplyTaskKey(vipClientId, vipClient.awaitingReplySince),
      triggerType: 'NO_REPLY',
      vipClientId,
      ownerId: vipClient.picId,
      title: `Follow up with ${vipClient.name ?? vipClient.shopDomain ?? 'client'}: no reply to the last BC message`,
      category: 'FOLLOW_UP',
      priority: 'MEDIUM',
    });
  }

  if (status === vipClient.relationshipStatus) {
    return { vipClient, status, hasChanged: false };
  }

  const updated = await updateRecord<VipClientRecord>({
    client,
    objectNameSingular: 'vipClient',
    id: vipClientId,
    data: { relationshipStatus: status, statusChangedAt: now },
    selection: { id: true },
  });

  await recordActivity(client, {
    vipClientId,
    type: 'STATUS_CHANGE',
    title: `Status changed to ${STATUS_LABELS[status]}`,
    direction: 'INTERNAL',
    actorMemberId,
    occurredAt: now,
    metadata: { from: vipClient.relationshipStatus, to: status },
  });

  return {
    vipClient: { ...vipClient, ...(updated ?? {}), relationshipStatus: status, statusChangedAt: now },
    status,
    hasChanged: true,
  };
};
