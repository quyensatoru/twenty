import { type ApiClient } from '../../types/api-client';
import { type BcReviewRecord, type VipClientRecord } from '../../types/bc-records';
import { type IngestReviewBody } from '../../types/ingest';
import { decideReviewAttribution } from '../../utils/automation-attribution.util';
import { readDirectReviewUrl } from '../../utils/automation-review.util';
import { recordActivity } from './activity-store.util';
import { listBcActivitiesBefore } from './automation-records.util';
import {
  requireIngestDate,
  requireIngestNumber,
  requireIngestString,
} from './ingest-route.util';
import { readBcSettings } from './read-bc-settings.util';
import { BC_REVIEW_SELECTION } from './record-selections';
import {
  createRecord,
  findFirstRecord,
  updateRecord,
} from './record-store.util';

export const ingestReview = async ({
  client,
  body,
  vipClient,
}: {
  client: ApiClient;
  body: IngestReviewBody;
  vipClient: VipClientRecord;
}): Promise<Record<string, unknown>> => {
  const reviewId = requireIngestString(body.reviewId, 'reviewId');
  const appName = requireIngestString(body.appName, 'appName').toUpperCase();
  const rating = requireIngestNumber(body.rating, 'rating');
  const publishedAt = requireIngestDate(body.publishedAt, 'publishedAt');
  const reviewUrl = readDirectReviewUrl(body.reviewUrl);

  if (rating < 1 || rating > 5) {
    throw new Error('Invalid rating: expected 1 to 5.');
  }

  const attribution = decideReviewAttribution({
    activities: await listBcActivitiesBefore({
      client,
      vipClientId: vipClient.id,
      eventAt: publishedAt,
      windowDays: readBcSettings().reviewAttributionDays,
    }),
    appName,
    publishedAt,
    windowDays: readBcSettings().reviewAttributionDays,
  });
  const data = {
    name: body.reviewerName?.trim() || vipClient.name || vipClient.shopDomain,
    appName,
    rating,
    body: body.body ?? null,
    publishedAt,
    reviewUrl,
    isVerified: body.isVerified !== false,
    creditedMemberId: attribution.attributedMemberId,
    evidenceActivityId: attribution.activityIds[0] ?? null,
    source: 'INGEST',
    vipClientId: vipClient.id,
  };
  const existing = await findFirstRecord<BcReviewRecord>({
    client,
    objectNamePlural: 'bcReviews',
    filter: { externalId: { eq: reviewId } },
    selection: BC_REVIEW_SELECTION,
  });

  if (existing !== null) {
    await updateRecord({
      client,
      objectNameSingular: 'bcReview',
      id: existing.id,
      // A link someone entered by hand is kept when the feed has none.
      data: { ...data, reviewUrl: reviewUrl ?? existing.reviewUrl },
    });

    return { reviewId: existing.id, isNew: false, isBcInfluenced: attribution.isBcInfluenced };
  }

  const review = await createRecord<BcReviewRecord>({
    client,
    objectNameSingular: 'bcReview',
    data: { ...data, externalId: reviewId },
    selection: { id: true },
  });

  await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'REVIEW',
    title: `${rating}★ review published for ${appName}`,
    summary: body.body ?? null,
    direction: 'INBOUND',
    topic: 'REVIEW',
    occurredAt: publishedAt,
    appName,
    externalId: `review:${reviewId}`,
    sourceUrl: reviewUrl,
    metadata: { reviewId: review.id, creditedMemberId: attribution.attributedMemberId },
  });

  return {
    reviewId: review.id,
    isNew: true,
    isBcInfluenced: attribution.isBcInfluenced,
    hasDirectLink: reviewUrl !== null,
  };
};
