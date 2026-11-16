import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { REVIEW_SAVE_ROUTE_PATH } from '../constants/route-paths';
import { REVIEW_SAVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type BcReviewRecord } from '../types/bc-records';
import { type ReviewSaveRequest } from '../types/dashboard';
import { decideReviewAttribution } from '../utils/automation-attribution.util';
import { readDirectReviewUrl } from '../utils/automation-review.util';
import { recordActivity } from './utils/activity-store.util';
import { listBcActivitiesBefore } from './utils/automation-records.util';
import { loadScopedVipClient } from './utils/client-store.util';
import { assertCanEditClient } from './utils/dashboard-data.util';
import { readBcSettings } from './utils/read-bc-settings.util';
import { BC_REVIEW_SELECTION } from './utils/record-selections';
import {
  createRecord,
  findFirstRecord,
  updateRecord,
} from './utils/record-store.util';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';

const readText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const handler = async (event: RoutePayload<Partial<ReviewSaveRequest>>) =>
  runBcRoute(async ({ client, scope }) => {
    const body = event.body ?? {};
    const vipClient = await loadScopedVipClient({
      client,
      scope,
      vipClientId: requireString(body.vipClientId, 'vipClientId'),
    });

    assertCanEditClient(scope, vipClient);

    const enteredUrl = readText(body.reviewUrl);
    const reviewUrl = readDirectReviewUrl(enteredUrl);

    if (enteredUrl !== null && reviewUrl === null) {
      throw new Error(
        'Use the link of the review itself (apps.shopify.com/<app>/reviews/<id>), not the app listing.',
      );
    }

    const reviewId = readText(body.reviewId);

    if (reviewId !== null) {
      const existing = await findFirstRecord<BcReviewRecord>({
        client,
        objectNamePlural: 'bcReviews',
        filter: { id: { eq: reviewId }, vipClientId: { eq: vipClient.id } },
        selection: BC_REVIEW_SELECTION,
      });

      if (existing === null) {
        throw new Error('This review no longer exists.');
      }

      const review = await updateRecord<BcReviewRecord>({
        client,
        objectNameSingular: 'bcReview',
        id: existing.id,
        data: { reviewUrl },
        selection: BC_REVIEW_SELECTION,
      });

      return { review };
    }

    const appName = requireString(body.appName, 'appName');
    const publishedAt = readText(body.publishedAt);

    if (publishedAt === null || Number.isNaN(Date.parse(publishedAt))) {
      throw new Error('Enter the date the review was published.');
    }

    const publishedAtIso = new Date(publishedAt).toISOString();

    if (Date.parse(publishedAtIso) > Date.now()) {
      throw new Error('A review cannot be published in the future.');
    }

    const rating = Number(body.rating);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('The rating must be 1 to 5 stars.');
    }

    const windowDays = readBcSettings().reviewAttributionDays;
    const attribution = decideReviewAttribution({
      activities: await listBcActivitiesBefore({
        client,
        vipClientId: vipClient.id,
        eventAt: publishedAtIso,
        windowDays,
      }),
      appName,
      publishedAt: publishedAtIso,
      windowDays,
    });
    const evidenceActivityId = attribution.activityIds[0] ?? null;
    const review = await createRecord<BcReviewRecord>({
      client,
      objectNameSingular: 'bcReview',
      data: {
        name: readText(body.reviewerName) ?? vipClient.name,
        appName,
        rating,
        body: readText(body.body),
        publishedAt: publishedAtIso,
        reviewUrl,
        isVerified: true,
        creditedMemberId: attribution.attributedMemberId,
        evidenceActivityId,
        source: 'MANUAL',
        vipClientId: vipClient.id,
      },
      selection: BC_REVIEW_SELECTION,
    });

    await recordActivity(client, {
      vipClientId: vipClient.id,
      type: 'REVIEW',
      title: `${appName} review published: ${rating}★`,
      summary: readText(body.body),
      direction: 'INBOUND',
      topic: 'REVIEW',
      actorMemberId: scope.workspaceMemberId,
      occurredAt: publishedAtIso,
      appName,
      sourceUrl: reviewUrl,
      metadata: { reviewId: review.id, evidenceActivityId },
    });

    return { review, isCredited: attribution.isBcInfluenced };
  });

export default defineLogicFunction({
  universalIdentifier: REVIEW_SAVE_LOGIC_FUNCTION_UID,
  name: 'bc-review-save',
  description:
    'Route: records a verified Shopify review of a client app, or adds its direct review link, and credits the BC whose request came first.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: REVIEW_SAVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
