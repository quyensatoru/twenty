import { type ApiClient } from '../../types/api-client';
import {
  type AppUsageEntry,
  type BcOpportunityRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import { type IngestUsageBody } from '../../types/ingest';
import { isStaleUsageEvent } from '../../utils/automation-upsell.util';
import { decideUsageThreshold } from '../../utils/automation-usage.util';
import {
  buildOpportunityKey,
  buildUsageTaskKey,
} from '../../utils/trigger-keys.util';
import { recordActivity } from './activity-store.util';
import { upsertAutoTask } from './auto-task.util';
import { withClientLock } from './automation-lock.util';
import { listPlanCatalog } from './automation-records.util';
import { createOrReadExisting } from './automation-unique.util';
import { readVipClient } from './client-store.util';
import { listAllRecords } from './list-all-records.util';
import {
  requireIngestDate,
  requireIngestNumber,
  requireIngestString,
} from './ingest-route.util';
import { BC_OPPORTUNITY_SELECTION } from './record-selections';
import {
  createRecord,
  findFirstRecord,
  updateRecord,
} from './record-store.util';

const upsertOpportunity = async ({
  client,
  vipClient,
  opportunityKey,
  appName,
  plan,
  billingCycle,
  used,
  limit,
}: {
  client: ApiClient;
  vipClient: VipClientRecord;
  opportunityKey: string;
  appName: string;
  plan: string;
  billingCycle: string;
  used: number;
  limit: number;
}): Promise<BcOpportunityRecord> => {
  const usage = {
    usagePercent: Math.round((used / limit) * 1000) / 10,
    usageUsed: used,
    usageLimit: limit,
  };
  const existing = await findFirstRecord<BcOpportunityRecord>({
    client,
    objectNamePlural: 'bcOpportunities',
    filter: { opportunityKey: { eq: opportunityKey } },
    selection: BC_OPPORTUNITY_SELECTION,
  });

  if (existing !== null) {
    return existing.status === 'OPEN'
      ? updateRecord<BcOpportunityRecord>({
          client,
          objectNameSingular: 'bcOpportunity',
          id: existing.id,
          data: usage,
          selection: BC_OPPORTUNITY_SELECTION,
        })
      : existing;
  }

  const { record } = await createOrReadExisting({
    readExisting: () =>
      findFirstRecord<BcOpportunityRecord>({
        client,
        objectNamePlural: 'bcOpportunities',
        filter: { opportunityKey: { eq: opportunityKey } },
        selection: BC_OPPORTUNITY_SELECTION,
      }),
    create: () =>
      createRecord<BcOpportunityRecord>({
        client,
        objectNameSingular: 'bcOpportunity',
        data: {
          name: `${appName} ${plan} upsell · ${billingCycle}`,
          appName,
          planCode: plan,
          billingCycle,
          opportunityKey,
          status: 'OPEN',
          vipClientId: vipClient.id,
          ...usage,
        },
        selection: BC_OPPORTUNITY_SELECTION,
      }),
  });

  return record;
};

// Older cycles of the same app and plan are superseded once a newer cycle
// raises its own opportunity; their history stays as LOST.
const closeOlderCycles = async ({
  client,
  vipClientId,
  appName,
  billingCycle,
  keepId,
}: {
  client: ApiClient;
  vipClientId: string;
  appName: string;
  billingCycle: string;
  keepId: string;
}): Promise<void> => {
  const open = await listAllRecords<BcOpportunityRecord>({
    client,
    pluralName: 'bcOpportunities',
    filter: { vipClientId: { eq: vipClientId }, status: { eq: 'OPEN' } },
    selection: BC_OPPORTUNITY_SELECTION,
  });

  for (const opportunity of open) {
    if (
      opportunity.id !== keepId &&
      (opportunity.appName ?? '').toUpperCase() === appName &&
      (opportunity.billingCycle ?? '') < billingCycle
    ) {
      await updateRecord({
        client,
        objectNameSingular: 'bcOpportunity',
        id: opportunity.id,
        data: { status: 'LOST' },
      });
    }
  }
};

const readAllowance = async (
  client: ApiClient,
  appName: string,
  plan: string,
  fallback: number,
): Promise<number> => {
  const catalogPlan = (await listPlanCatalog(client)).find(
    (candidate) =>
      (candidate.appName ?? '').toUpperCase() === appName &&
      (candidate.planCode ?? '').toUpperCase() === plan.toUpperCase(),
  );
  const allowance = catalogPlan?.usageAllowance ?? null;

  // The catalog is the agreed allowance; the caller's figure only fills in
  // for plans nobody priced yet.
  return allowance !== null && allowance > 0 ? allowance : fallback;
};

type StoredUsageEntry = AppUsageEntry & { eventId?: string | null };

// One opportunity and one task per client, app, plan and billing cycle: 80%
// creates them, 100% raises the same task to High, retries change nothing.
// Runs under the client's usage lock so two apps' readings arriving together
// do not overwrite each other's appUsage entry.
export const ingestUsage = async ({
  client,
  body,
  vipClient,
}: {
  client: ApiClient;
  body: IngestUsageBody;
  vipClient: VipClientRecord;
}): Promise<Record<string, unknown>> =>
  withClientLock(`usage:${vipClient.id}`, () => ingestUsageLocked({ client, body, vipClient }));

const ingestUsageLocked = async ({
  client,
  body,
  vipClient: staleClient,
}: {
  client: ApiClient;
  body: IngestUsageBody;
  vipClient: VipClientRecord;
}): Promise<Record<string, unknown>> => {
  const appName = requireIngestString(body.appName, 'appName').toUpperCase();
  const plan = requireIngestString(body.plan, 'plan');
  const billingCycle = requireIngestString(body.billingCycle, 'billingCycle');
  const used = requireIngestNumber(body.used, 'used');
  const callerLimit = requireIngestNumber(body.limit, 'limit');
  const at = body.at === undefined ? new Date().toISOString() : requireIngestDate(body.at, 'at');
  const eventId =
    typeof body.eventId === 'string' && body.eventId.trim().length > 0
      ? body.eventId.trim()
      : null;
  const vipClient = (await readVipClient(client, staleClient.id)) ?? staleClient;
  const previousEntry = (vipClient.appUsage ?? {})[appName] as StoredUsageEntry | undefined;

  if (isStaleUsageEvent({ previous: previousEntry, at, eventId })) {
    return { decision: 'NONE', ignored: 'stale or repeated usage event' };
  }

  const limit = await readAllowance(client, appName, plan, callerLimit);
  const usageEntry: StoredUsageEntry = { used, limit, cycle: billingCycle, plan, at, eventId };

  await updateRecord({
    client,
    objectNameSingular: 'vipClient',
    id: vipClient.id,
    data: { appUsage: { ...(vipClient.appUsage ?? {}), [appName]: usageEntry } },
  });

  const decision = decideUsageThreshold(used, limit);

  if (decision === 'NONE') {
    return { decision };
  }

  const opportunityKey = buildOpportunityKey({
    vipClientId: vipClient.id,
    appName,
    plan,
    billingCycle,
  });
  const opportunity = await upsertOpportunity({
    client,
    vipClient,
    opportunityKey,
    appName,
    plan,
    billingCycle,
    used,
    limit,
  });

  await closeOlderCycles({
    client,
    vipClientId: vipClient.id,
    appName,
    billingCycle,
    keepId: opportunity.id,
  });

  if (opportunity.status !== 'OPEN') {
    return { decision, opportunityId: opportunity.id, task: 'opportunity already closed' };
  }

  const percent = Math.round((used / limit) * 100);
  const clientName = vipClient.name ?? vipClient.shopDomain ?? 'client';
  const { task, outcome } = await upsertAutoTask(client, {
    triggerKey: buildUsageTaskKey(opportunityKey),
    triggerType: 'USAGE_THRESHOLD',
    vipClientId: vipClient.id,
    ownerId: vipClient.picId,
    title:
      decision === 'ESCALATE'
        ? `${clientName} reached ${percent}% of the ${appName} ${plan} allowance: discuss an upgrade`
        : `${clientName} is at ${percent}% of the ${appName} ${plan} allowance: discuss an upgrade`,
    notes: `${used} / ${limit} used in billing cycle ${billingCycle}.`,
    category: 'UPSELL',
    priority: decision === 'ESCALATE' ? 'HIGH' : 'MEDIUM',
    appName,
    opportunityId: opportunity.id,
  });

  // One timeline entry per threshold crossing, whichever event crossed it.
  await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'USAGE',
    title: `${appName} usage reached ${decision === 'ESCALATE' ? '100' : '80'}% of the ${plan} allowance`,
    summary: `${used} / ${limit} in ${billingCycle}`,
    direction: 'INTERNAL',
    topic: 'UPSELL',
    occurredAt: at,
    appName,
    externalId: `usage:${opportunityKey}:${decision === 'ESCALATE' ? '100' : '80'}`,
    metadata: { opportunityId: opportunity.id, taskId: task.id, used, limit, eventId },
  });

  return { decision, opportunityId: opportunity.id, taskId: task.id, task: outcome };
};
