import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { INGEST_REVIEW_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_REVIEW_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IngestReviewBody } from '../types/ingest';
import { ingestReview } from './utils/ingest-review.util';
import {
  INGEST_SECRET_HEADER,
  runIngestRoute,
} from './utils/ingest-route.util';

const handler = async (event: RoutePayload<IngestReviewBody>) =>
  runIngestRoute<IngestReviewBody>(event, ingestReview);

export default defineLogicFunction({
  universalIdentifier: INGEST_REVIEW_LOGIC_FUNCTION_UID,
  name: 'ingest-review',
  description:
    'Ingest: a published Shopify App Store review of a VIP client, credited to the BC who asked for it before publication.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: INGEST_REVIEW_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [INGEST_SECRET_HEADER],
  },
  handler,
});
