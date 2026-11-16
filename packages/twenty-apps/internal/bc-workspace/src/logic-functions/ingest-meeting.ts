import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { INGEST_MEETING_ROUTE_PATH } from '../constants/route-paths';
import { INGEST_MEETING_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IngestMeetingBody } from '../types/ingest';
import { ingestMeeting } from './utils/ingest-meeting.util';
import {
  INGEST_SECRET_HEADER,
  runIngestRoute,
} from './utils/ingest-route.util';

const handler = async (event: RoutePayload<IngestMeetingBody>) =>
  runIngestRoute<IngestMeetingBody>(event, ingestMeeting);

export default defineLogicFunction({
  universalIdentifier: INGEST_MEETING_LOGIC_FUNCTION_UID,
  name: 'ingest-meeting',
  description:
    'Ingest: a calendar meeting with a VIP client; a completed one counts as BC contact.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: INGEST_MEETING_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [INGEST_SECRET_HEADER],
  },
  handler,
});
