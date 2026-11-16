import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { ACTIVITY_LOG_ROUTE_PATH } from '../constants/route-paths';
import { ACTIVITY_LOG_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type ActivityTopic,
  type MeetingStatus,
} from '../types/bc-records';
import { type ActivityLogRequest } from '../types/dashboard';
import { recordActivity } from './utils/activity-store.util';
import { loadScopedVipClient } from './utils/client-store.util';
import { assertCanEditClient } from './utils/dashboard-data.util';
import { recomputeClientStatus } from './utils/recompute-client-status.util';
import { updateRecord } from './utils/record-store.util';
import { requireString } from './utils/require-string.util';
import { runBcRoute } from './utils/run-bc-route.util';

const LOGGABLE_TYPES: ActivityLogRequest['type'][] = [
  'MEETING',
  'EMAIL',
  'CALL',
  'NOTE',
  'REVIEW_REQUEST',
];
const TOPICS: ActivityTopic[] = ['GENERAL', 'UPSELL', 'REVIEW', 'ISSUE', 'ONBOARDING', 'RETENTION'];
const MEETING_STATUSES: MeetingStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

const TITLES: Record<ActivityLogRequest['type'], string> = {
  MEETING: 'Meeting',
  EMAIL: 'Email sent',
  CALL: 'Phone call',
  NOTE: 'Note',
  REVIEW_REQUEST: 'Review requested',
};

const handler = async (event: RoutePayload<Partial<ActivityLogRequest>>) =>
  runBcRoute(async ({ client, scope }) => {
    const body = event.body ?? {};
    const vipClient = await loadScopedVipClient({
      client,
      scope,
      vipClientId: requireString(body.vipClientId, 'vipClientId'),
    });

    assertCanEditClient(scope, vipClient);

    const type = body.type;

    if (type === undefined || !LOGGABLE_TYPES.includes(type)) {
      throw new Error('Choose what kind of activity to log.');
    }

    const summary = requireString(body.summary, 'summary');
    const topic: ActivityTopic =
      type === 'REVIEW_REQUEST'
        ? 'REVIEW'
        : body.topic !== undefined && TOPICS.includes(body.topic)
          ? body.topic
          : 'GENERAL';
    const meetingStatus: MeetingStatus | null =
      type === 'MEETING'
        ? body.meetingStatus != null && MEETING_STATUSES.includes(body.meetingStatus)
          ? body.meetingStatus
          : 'COMPLETED'
        : null;
    const now = new Date().toISOString();
    const occurredAt =
      typeof body.occurredAt === 'string' && !Number.isNaN(Date.parse(body.occurredAt))
        ? new Date(body.occurredAt).toISOString()
        : now;

    if (Date.parse(occurredAt) > Date.parse(now) && meetingStatus !== 'SCHEDULED') {
      throw new Error('Only a scheduled meeting can be in the future.');
    }

    const isContact = type !== 'NOTE';
    // A booked or cancelled meeting is not contact yet.
    const isQualifyingContact =
      isContact && (type !== 'MEETING' || meetingStatus === 'COMPLETED');

    const { activity } = await recordActivity(client, {
      vipClientId: vipClient.id,
      type,
      title: TITLES[type],
      summary,
      direction: isContact ? 'OUTBOUND' : 'INTERNAL',
      topic,
      meetingStatus,
      isBcAuthored: isQualifyingContact,
      actorMemberId: scope.workspaceMemberId,
      occurredAt,
      appName: typeof body.appName === 'string' && body.appName.length > 0 ? body.appName : null,
    });

    if (isQualifyingContact) {
      const isLatest =
        vipClient.lastBcContactAt === null ||
        Date.parse(occurredAt) >= Date.parse(vipClient.lastBcContactAt);
      const data: Record<string, unknown> = {};

      if (isLatest) {
        data.lastBcContactAt = occurredAt;
        data.lastBcContactMemberId = scope.workspaceMemberId;
      }

      // A sent email waits for an answer; calls and meetings are answered live.
      if (type === 'EMAIL' && isLatest) {
        data.awaitingReplySince = occurredAt;
      } else if ((type === 'CALL' || type === 'MEETING') && isLatest) {
        data.awaitingReplySince = null;
      }

      if (Object.keys(data).length > 0) {
        await updateRecord({
          client,
          objectNameSingular: 'vipClient',
          id: vipClient.id,
          data,
        });
      }
    }

    const { status } = await recomputeClientStatus({
      client,
      vipClientId: vipClient.id,
      actorMemberId: scope.workspaceMemberId,
      now,
    });

    return { activityId: activity.id, status };
  });

export default defineLogicFunction({
  universalIdentifier: ACTIVITY_LOG_LOGIC_FUNCTION_UID,
  name: 'bc-activity-log',
  description:
    "Route: logs a BC meeting, email, call, note or review request on a client's timeline.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: ACTIVITY_LOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
