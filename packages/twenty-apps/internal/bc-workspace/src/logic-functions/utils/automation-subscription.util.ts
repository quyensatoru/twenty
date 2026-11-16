import { type ApiClient } from '../../types/api-client';
import {
  type BcOpportunityRecord,
  type BcSubscriptionEventRecord,
  type RecordSource,
  type SubscriptionEventType,
  type VipClientRecord,
} from '../../types/bc-records';
import { decideUpgradeAttribution } from '../../utils/automation-attribution.util';
import { pickOpportunityToConvert } from '../../utils/automation-upsell.util';
import {
  buildDowngradeTaskKey,
  buildSubscriptionEventKey,
  buildUninstallTaskKey,
} from '../../utils/trigger-keys.util';
import { recordActivity } from './activity-store.util';
import { upsertAutoTask } from './auto-task.util';
import { createOrReadExisting } from './automation-unique.util';
import {
  listBcActivitiesBefore,
  listOpenOpportunities,
} from './automation-records.util';
import { readBcSettings } from './read-bc-settings.util';
import { recomputeClientStatus } from './recompute-client-status.util';
import {
  BC_OPPORTUNITY_SELECTION,
  BC_SUBSCRIPTION_EVENT_SELECTION,
} from './record-selections';
import {
  createRecord,
  findFirstRecord,
  updateRecord,
} from './record-store.util';

export type SubscriptionChangeInput = {
  vipClient: VipClientRecord;
  merchantId: string | null;
  appName: string | null;
  eventType: SubscriptionEventType;
  oldPlan: string | null;
  newPlan: string | null;
  // When the change took effect, not when a system reported it.
  occurredAt: string;
  mrrDelta: number | null;
  source: RecordSource;
  // The reporting system's own event id, kept as evidence only.
  sourceEventId?: string | null;
};

const EVENT_TITLES: Record<SubscriptionEventType, string> = {
  INSTALL: 'installed',
  UPGRADE: 'upgraded',
  DOWNGRADE: 'downgraded',
  UNINSTALL: 'uninstalled',
  REINSTALL: 'reinstalled',
  CANCEL: 'cancelled',
};

const describePlans = (oldPlan: string | null, newPlan: string | null): string =>
  oldPlan === null && newPlan === null
    ? ''
    : ` (${oldPlan ?? '—'} → ${newPlan ?? '—'})`;

type UpgradeAttribution = {
  isBcInfluenced: boolean;
  attributedMemberId: string | null;
  attributionEvidence: Record<string, unknown> | null;
  opportunityId: string | null;
};

const NO_ATTRIBUTION: UpgradeAttribution = {
  isBcInfluenced: false,
  attributedMemberId: null,
  attributionEvidence: null,
  opportunityId: null,
};

const decideAttribution = async (
  client: ApiClient,
  input: SubscriptionChangeInput,
): Promise<UpgradeAttribution> => {
  if (input.eventType !== 'UPGRADE') {
    return NO_ATTRIBUTION;
  }

  const settings = readBcSettings();
  const [activities, opportunities] = await Promise.all([
    listBcActivitiesBefore({
      client,
      vipClientId: input.vipClient.id,
      eventAt: input.occurredAt,
      windowDays: settings.upsellAttributionDays,
    }),
    listOpenOpportunities({ client, vipClientId: input.vipClient.id, appName: input.appName }),
  ]);
  const opportunitiesBefore = opportunities.filter(
    (opportunity) => Date.parse(opportunity.createdAt) <= Date.parse(input.occurredAt),
  );
  const decision = decideUpgradeAttribution({
    activities,
    openOpportunityCreatedAts: opportunitiesBefore.map((opportunity) => opportunity.createdAt),
    appName: input.appName,
    changedAt: input.occurredAt,
    windowDays: settings.upsellAttributionDays,
  });
  const opportunity = pickOpportunityToConvert(
    opportunities,
    input.appName,
    input.occurredAt,
  );

  return {
    isBcInfluenced: decision.isBcInfluenced,
    attributedMemberId: decision.attributedMemberId,
    attributionEvidence: {
      activityIds: decision.activityIds,
      reason: decision.reason,
      effectiveAt: input.occurredAt,
    },
    opportunityId: opportunity?.id ?? null,
  };
};

const readEventByKey = (client: ApiClient, externalId: string) =>
  findFirstRecord<BcSubscriptionEventRecord>({
    client,
    objectNamePlural: 'bcSubscriptionEvents',
    filter: { externalId: { eq: externalId } },
    selection: BC_SUBSCRIPTION_EVENT_SELECTION,
  });

// A later report of the same change (the billing ingest after the CRM sync,
// or the other way round) confirms the record instead of adding one.
const mergeSecondSource = async (
  client: ApiClient,
  existing: BcSubscriptionEventRecord,
  input: SubscriptionChangeInput,
): Promise<BcSubscriptionEventRecord> => {
  const data: Record<string, unknown> = {};

  if (input.source === 'INGEST' && existing.source !== 'INGEST') {
    data.source = 'INGEST';
    data.isVerified = true;
  }

  if (existing.mrrDelta === null && input.mrrDelta !== null) {
    data.mrrDelta = input.mrrDelta;
  }

  if (existing.merchantId === null && input.merchantId !== null) {
    data.merchantId = input.merchantId;
  }

  if (typeof input.sourceEventId === 'string' && input.sourceEventId.length > 0) {
    const evidence = existing.attributionEvidence ?? {};
    const sourceEventIds = Array.isArray(evidence.sourceEventIds)
      ? (evidence.sourceEventIds as string[])
      : [];

    if (!sourceEventIds.includes(input.sourceEventId)) {
      data.attributionEvidence = {
        ...evidence,
        sourceEventIds: [...sourceEventIds, input.sourceEventId],
      };
    }
  }

  if (Object.keys(data).length === 0) {
    return existing;
  }

  return updateRecord<BcSubscriptionEventRecord>({
    client,
    objectNameSingular: 'bcSubscriptionEvent',
    id: existing.id,
    data,
    selection: BC_SUBSCRIPTION_EVENT_SELECTION,
  });
};

// The one path every verified plan event takes, whether the CRM merchant sync
// or the billing system reported it. Keyed by the change itself, so both
// sources and every retry land on one record; the follow-ups run every time
// and are keyed too, so a retry after a partial failure completes them.
export const recordSubscriptionChange = async (
  client: ApiClient,
  input: SubscriptionChangeInput,
): Promise<{ event: BcSubscriptionEventRecord; isNew: boolean }> => {
  const { vipClient, appName, eventType } = input;
  const eventKey = buildSubscriptionEventKey({
    vipClientId: vipClient.id,
    appName,
    eventType,
    newPlan: input.newPlan,
    effectiveAt: input.occurredAt,
  });
  const found = await readEventByKey(client, eventKey);
  let event: BcSubscriptionEventRecord;
  let isNew = false;

  if (found !== null) {
    event = await mergeSecondSource(client, found, input);
  } else {
    const attribution = await decideAttribution(client, input);
    const created = await createOrReadExisting({
      readExisting: () => readEventByKey(client, eventKey),
      create: () =>
        createRecord<BcSubscriptionEventRecord>({
          client,
          objectNameSingular: 'bcSubscriptionEvent',
          data: {
            name: `${appName ?? 'App'} ${EVENT_TITLES[eventType]}${describePlans(input.oldPlan, input.newPlan)}`,
            appName,
            eventType,
            oldPlan: input.oldPlan,
            newPlan: input.newPlan,
            occurredAt: input.occurredAt,
            mrrDelta: input.mrrDelta,
            isVerified: true,
            source: input.source,
            externalId: eventKey,
            isBcInfluenced: attribution.isBcInfluenced,
            attributedMemberId: attribution.attributedMemberId,
            attributionEvidence:
              attribution.attributionEvidence === null && !input.sourceEventId
                ? null
                : {
                    ...(attribution.attributionEvidence ?? {}),
                    ...(input.sourceEventId ? { sourceEventIds: [input.sourceEventId] } : {}),
                  },
            merchantId: input.merchantId,
            opportunityId: attribution.opportunityId,
            vipClientId: vipClient.id,
          },
          selection: BC_SUBSCRIPTION_EVENT_SELECTION,
        }),
    });

    event = created.record;
    isNew = created.isNew;

    if (!created.isNew) {
      event = await mergeSecondSource(client, event, input);
    }
  }

  await runSubscriptionFollowUps(client, { input, event, eventKey });

  return { event, isNew };
};

const runSubscriptionFollowUps = async (
  client: ApiClient,
  {
    input,
    event,
    eventKey,
  }: {
    input: SubscriptionChangeInput;
    event: BcSubscriptionEventRecord;
    eventKey: string;
  },
): Promise<void> => {
  const { vipClient, appName, eventType } = input;

  // The opportunity converts on the verified upgrade, credited or not.
  if (eventType === 'UPGRADE' && event.opportunityId !== null) {
    const opportunity = await findFirstRecord<BcOpportunityRecord>({
      client,
      objectNamePlural: 'bcOpportunities',
      filter: { id: { eq: event.opportunityId } },
      selection: BC_OPPORTUNITY_SELECTION,
    });

    if (opportunity !== null && opportunity.status === 'OPEN') {
      await updateRecord({
        client,
        objectNameSingular: 'bcOpportunity',
        id: opportunity.id,
        data: { status: 'CONVERTED', convertedAt: event.occurredAt ?? input.occurredAt },
      });
    }
  }

  await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'SUBSCRIPTION',
    title: `${appName ?? 'App'} ${EVENT_TITLES[eventType]}${describePlans(input.oldPlan, input.newPlan)}`,
    direction: 'INTERNAL',
    topic: eventType === 'UPGRADE' ? 'UPSELL' : eventType === 'INSTALL' ? 'GENERAL' : 'RETENTION',
    occurredAt: event.occurredAt ?? input.occurredAt,
    appName,
    externalId: `subscription:${eventKey}`,
    metadata: { subscriptionEventId: event.id, eventType },
  });

  const clientName = vipClient.name ?? vipClient.shopDomain ?? 'client';

  if (eventType === 'DOWNGRADE') {
    await upsertAutoTask(client, {
      triggerKey: buildDowngradeTaskKey(eventKey),
      triggerType: 'DOWNGRADE',
      vipClientId: vipClient.id,
      ownerId: vipClient.picId,
      title: `Understand downgrade of ${appName ?? 'app'} at ${clientName}`,
      notes: `Plan changed${describePlans(input.oldPlan, input.newPlan)}.`,
      category: 'RETENTION',
      priority: 'HIGH',
      appName,
    });
  }

  if (eventType === 'UNINSTALL' || eventType === 'CANCEL') {
    await upsertAutoTask(client, {
      triggerKey: buildUninstallTaskKey(eventKey),
      triggerType: 'UNINSTALL',
      vipClientId: vipClient.id,
      ownerId: vipClient.picId,
      title: `Understand why ${clientName} ${EVENT_TITLES[eventType]} ${appName ?? 'the app'}`,
      category: 'RETENTION',
      priority: 'HIGH',
      appName,
    });
  }

  await recomputeClientStatus({ client, vipClientId: vipClient.id });
};
