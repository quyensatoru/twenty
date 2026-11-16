import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { INGEST_USAGE_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_USAGE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IngestUsageBody } from '../types/ingest';
import { ingestUsage } from './utils/ingest-usage.util';
import {
  INGEST_SECRET_HEADER,
  runIngestRoute,
} from './utils/ingest-route.util';

const handler = async (event: RoutePayload<IngestUsageBody>) =>
  runIngestRoute<IngestUsageBody>(event, ingestUsage);

export default defineLogicFunction({
  universalIdentifier: INGEST_USAGE_LOGIC_FUNCTION_UID,
  name: 'ingest-usage',
  description:
    'Ingest: plan usage of a VIP client app; 80% opens an upsell task, 100% escalates the same task.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: INGEST_USAGE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [INGEST_SECRET_HEADER],
  },
  handler,
});
