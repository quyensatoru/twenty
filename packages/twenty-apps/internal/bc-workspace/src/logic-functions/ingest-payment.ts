import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { INGEST_PAYMENT_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_PAYMENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IngestPaymentBody } from '../types/ingest';
import { ingestPayment } from './utils/ingest-payment.util';
import {
  INGEST_SECRET_HEADER,
  runIngestRoute,
} from './utils/ingest-route.util';

const handler = async (event: RoutePayload<IngestPaymentBody>) =>
  runIngestRoute<IngestPaymentBody>(event, ingestPayment);

export default defineLogicFunction({
  universalIdentifier: INGEST_PAYMENT_LOGIC_FUNCTION_UID,
  name: 'ingest-payment',
  description:
    'Ingest: a collected payment or refund of a VIP client, the source of realized lifetime revenue.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: INGEST_PAYMENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [INGEST_SECRET_HEADER],
  },
  handler,
});
