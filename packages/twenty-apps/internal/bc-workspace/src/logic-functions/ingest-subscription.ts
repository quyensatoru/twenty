import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { INGEST_SUBSCRIPTION_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_SUBSCRIPTION_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IngestSubscriptionBody } from '../types/ingest';
import { ingestSubscription } from './utils/ingest-subscription.util';
import {
  INGEST_SECRET_HEADER,
  runIngestRoute,
} from './utils/ingest-route.util';

const handler = async (event: RoutePayload<IngestSubscriptionBody>) =>
  runIngestRoute<IngestSubscriptionBody>(event, ingestSubscription);

export default defineLogicFunction({
  universalIdentifier: INGEST_SUBSCRIPTION_LOGIC_FUNCTION_UID,
  name: 'ingest-subscription',
  description:
    'Ingest: a verified plan change, install or uninstall from billing, with BC attribution and retention tasks.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: INGEST_SUBSCRIPTION_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [INGEST_SECRET_HEADER],
  },
  handler,
});
