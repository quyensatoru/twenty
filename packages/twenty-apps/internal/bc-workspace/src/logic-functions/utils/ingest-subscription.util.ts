import { type ApiClient } from '../../types/api-client';
import {
  type SubscriptionEventType,
  type VipClientRecord,
} from '../../types/bc-records';
import { type IngestSubscriptionBody } from '../../types/ingest';
import { recordSubscriptionChange } from './automation-subscription.util';
import {
  requireIngestDate,
  requireIngestString,
} from './ingest-route.util';

const EVENT_TYPES: SubscriptionEventType[] = [
  'INSTALL',
  'UPGRADE',
  'DOWNGRADE',
  'UNINSTALL',
  'REINSTALL',
  'CANCEL',
];

export const ingestSubscription = async ({
  client,
  body,
  vipClient,
}: {
  client: ApiClient;
  body: IngestSubscriptionBody;
  vipClient: VipClientRecord;
}): Promise<Record<string, unknown>> => {
  const eventId = requireIngestString(body.eventId, 'eventId');
  const appName = requireIngestString(body.appName, 'appName').toUpperCase();
  const eventType = EVENT_TYPES.find((type) => type === body.eventType);

  if (eventType === undefined) {
    throw new Error(`Invalid eventType: expected one of ${EVENT_TYPES.join(', ')}.`);
  }

  const { event, isNew } = await recordSubscriptionChange(client, {
    vipClient,
    merchantId: null,
    appName,
    eventType,
    oldPlan: body.oldPlan ?? null,
    newPlan: body.newPlan ?? null,
    occurredAt: requireIngestDate(body.occurredAt, 'occurredAt'),
    mrrDelta:
      typeof body.mrrDelta === 'number' && Number.isFinite(body.mrrDelta)
        ? body.mrrDelta
        : null,
    source: 'INGEST',
    sourceEventId: eventId,
  });

  return { subscriptionEventId: event.id, isNew, isBcInfluenced: event.isBcInfluenced };
};
