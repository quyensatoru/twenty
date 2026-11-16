import { type ApiClient } from '../../types/api-client';
import {
  type BcReviewRecord,
  type BcSubscriptionEventRecord,
  type VipClientRecord,
} from '../../types/bc-records';
import {
  type AttributionCorrectionInput,
  type SettingsAttributionRecord,
} from '../../types/settings';
import { recordActivity } from './activity-store.util';
import { listAllRecords } from './list-all-records.util';
import {
  BC_REVIEW_SELECTION,
  BC_SUBSCRIPTION_EVENT_SELECTION,
} from './record-selections';
import { findFirstRecord, updateRecord } from './record-store.util';

const RECENT_LIMIT = 100;

export const listAttributionRecords = async (
  client: ApiClient,
  memberNames: Map<string, string>,
): Promise<SettingsAttributionRecord[]> => {
  const [events, reviews, clients] = await Promise.all([
    listAllRecords<BcSubscriptionEventRecord>({
      client,
      pluralName: 'bcSubscriptionEvents',
      filter: { eventType: { eq: 'UPGRADE' } },
      selection: BC_SUBSCRIPTION_EVENT_SELECTION,
      orderBy: [{ occurredAt: 'DescNullsLast' }],
      maxRecords: RECENT_LIMIT,
    }),
    listAllRecords<BcReviewRecord>({
      client,
      pluralName: 'bcReviews',
      selection: BC_REVIEW_SELECTION,
      orderBy: [{ publishedAt: 'DescNullsLast' }],
      maxRecords: RECENT_LIMIT,
    }),
    listAllRecords<Pick<VipClientRecord, 'id' | 'name' | 'shopDomain'>>({
      client,
      pluralName: 'vipClients',
      selection: { id: true, name: true, shopDomain: true },
    }),
  ]);
  const clientNames = new Map(
    clients.map((vipClient) => [vipClient.id, vipClient.name ?? vipClient.shopDomain ?? '']),
  );
  const readMemberName = (memberId: string | null) =>
    memberId === null ? null : (memberNames.get(memberId) ?? null);

  return [
    ...events.map((event) => ({
      kind: 'SUBSCRIPTION_EVENT' as const,
      id: event.id,
      label: event.name ?? '',
      clientName: event.vipClientId === null ? '' : (clientNames.get(event.vipClientId) ?? ''),
      appName: event.appName,
      occurredAt: event.occurredAt,
      creditedMemberId: event.attributedMemberId,
      creditedMemberName: readMemberName(event.attributedMemberId),
    })),
    ...reviews.map((review) => ({
      kind: 'REVIEW' as const,
      id: review.id,
      label: `${review.rating ?? '?'}★ ${review.appName ?? ''}`.trim(),
      clientName: review.vipClientId === null ? '' : (clientNames.get(review.vipClientId) ?? ''),
      appName: review.appName,
      occurredAt: review.publishedAt,
      creditedMemberId: review.creditedMemberId,
      creditedMemberName: readMemberName(review.creditedMemberId),
    })),
  ].sort((left, right) => (right.occurredAt ?? '').localeCompare(left.occurredAt ?? ''));
};

// A misattributed outcome is corrected in place and the correction itself is
// kept on the client timeline: who changed the credit, from whom, to whom and
// why. Nothing is deleted, so the analytics history stays explainable.
export const correctAttribution = async ({
  client,
  input,
  actorMemberId,
}: {
  client: ApiClient;
  input: AttributionCorrectionInput;
  actorMemberId: string | null;
}): Promise<void> => {
  const reason = input.reason?.trim() ?? '';

  if (reason.length === 0) {
    throw new Error('Explain why the credit is corrected.');
  }

  const memberId =
    typeof input.memberId === 'string' && input.memberId.length > 0 ? input.memberId : null;
  const at = new Date().toISOString();

  if (typeof input.subscriptionEventId === 'string' && input.subscriptionEventId.length > 0) {
    const event = await findFirstRecord<BcSubscriptionEventRecord>({
      client,
      objectNamePlural: 'bcSubscriptionEvents',
      filter: { id: { eq: input.subscriptionEventId } },
      selection: BC_SUBSCRIPTION_EVENT_SELECTION,
    });

    if (event === null) {
      throw new Error('This subscription event no longer exists.');
    }

    const before = { memberId: event.attributedMemberId, isBcInfluenced: event.isBcInfluenced };
    const after = { memberId, isBcInfluenced: memberId !== null };
    const corrections = Array.isArray(event.attributionEvidence?.corrections)
      ? (event.attributionEvidence?.corrections as unknown[])
      : [];

    await updateRecord({
      client,
      objectNameSingular: 'bcSubscriptionEvent',
      id: event.id,
      data: {
        attributedMemberId: memberId,
        isBcInfluenced: memberId !== null,
        attributionEvidence: {
          ...(event.attributionEvidence ?? {}),
          corrections: [...corrections, { at, actorMemberId, before, after, reason }],
        },
      },
    });

    await recordCorrection({ client, vipClientId: event.vipClientId, label: event.name, before, after, reason, actorMemberId, at, recordId: event.id });

    return;
  }

  if (typeof input.reviewId === 'string' && input.reviewId.length > 0) {
    const review = await findFirstRecord<BcReviewRecord>({
      client,
      objectNamePlural: 'bcReviews',
      filter: { id: { eq: input.reviewId } },
      selection: BC_REVIEW_SELECTION,
    });

    if (review === null) {
      throw new Error('This review no longer exists.');
    }

    const before = { memberId: review.creditedMemberId };
    const after = { memberId };

    await updateRecord({
      client,
      objectNameSingular: 'bcReview',
      id: review.id,
      data: {
        creditedMemberId: memberId,
        ...(memberId === null ? { evidenceActivityId: null } : {}),
      },
    });

    await recordCorrection({ client, vipClientId: review.vipClientId, label: `${review.appName ?? ''} review`, before, after, reason, actorMemberId, at, recordId: review.id });

    return;
  }

  throw new Error('Choose the upgrade or review to correct.');
};

const recordCorrection = async ({
  client,
  vipClientId,
  label,
  before,
  after,
  reason,
  actorMemberId,
  at,
  recordId,
}: {
  client: ApiClient;
  vipClientId: string | null;
  label: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  actorMemberId: string | null;
  at: string;
  recordId: string;
}) => {
  await recordActivity(client, {
    vipClientId,
    type: 'SYSTEM',
    title: `Attribution corrected: ${label ?? ''}`.trim(),
    summary: reason,
    direction: 'INTERNAL',
    actorMemberId,
    occurredAt: at,
    externalId: `attribution-correction:${recordId}:${at}`,
    metadata: { correction: 'ATTRIBUTION', recordId, before, after, reason, actor: actorMemberId },
  });
};
