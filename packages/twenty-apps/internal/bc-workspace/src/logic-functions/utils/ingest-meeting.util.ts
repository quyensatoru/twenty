import { type ApiClient } from '../../types/api-client';
import {
  type ActivityTopic,
  type BcActivityRecord,
  type MeetingStatus,
  type VipClientRecord,
} from '../../types/bc-records';
import { type IngestMeetingBody } from '../../types/ingest';
import { recordActivity } from './activity-store.util';
import { endReplyWait } from './automation-no-reply.util';
import {
  requireIngestDate,
  requireIngestString,
} from './ingest-route.util';
import { recomputeClientStatus } from './recompute-client-status.util';
import { updateRecord } from './record-store.util';
import { listWorkspaceMembers } from './workspace-members.util';

const MEETING_STATUSES: MeetingStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
const TOPICS: ActivityTopic[] = ['GENERAL', 'UPSELL', 'REVIEW', 'ISSUE', 'ONBOARDING', 'RETENTION'];

// One meeting, one timeline entry however often the calendar re-sends it;
// only a held meeting counts as BC contact.
export const ingestMeeting = async ({
  client,
  body,
  vipClient,
}: {
  client: ApiClient;
  body: IngestMeetingBody;
  vipClient: VipClientRecord;
}): Promise<Record<string, unknown>> => {
  const meetingId = requireIngestString(body.meetingId, 'meetingId');
  const ownerEmail = requireIngestString(body.ownerEmail, 'ownerEmail').toLowerCase();
  const startedAt = requireIngestDate(body.startedAt, 'startedAt');
  const status = MEETING_STATUSES.find((value) => value === body.status);

  if (status === undefined) {
    throw new Error('Invalid status: expected SCHEDULED, COMPLETED or CANCELLED.');
  }

  const topic = TOPICS.find((value) => value === body.topic) ?? 'GENERAL';
  const owner = (await listWorkspaceMembers(client)).find(
    (member) => (member.email ?? '').toLowerCase() === ownerEmail,
  );

  if (owner === undefined) {
    throw new Error(`No workspace member has the email ${ownerEmail}.`);
  }

  const isCompleted = status === 'COMPLETED';
  const fields = {
    title: body.title?.trim() || 'Meeting',
    summary: body.summary ?? null,
    meetingStatus: status,
    topic,
    isBcAuthored: isCompleted,
  };
  const { activity, isNew } = await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'MEETING',
    direction: 'OUTBOUND',
    actorMemberId: owner.id,
    occurredAt: startedAt,
    externalId: `meeting:${meetingId}`,
    ...fields,
  });

  if (!isNew) {
    await updateRecord<BcActivityRecord>({
      client,
      objectNameSingular: 'bcActivity',
      id: activity.id,
      data: { ...fields, occurredAt: startedAt },
    });
  }

  if (
    isCompleted &&
    (vipClient.lastBcContactAt === null ||
      Date.parse(startedAt) > Date.parse(vipClient.lastBcContactAt))
  ) {
    await updateRecord({
      client,
      objectNameSingular: 'vipClient',
      id: vipClient.id,
      data: { lastBcContactAt: startedAt, lastBcContactMemberId: owner.id },
    });
  }

  // A held meeting is the client's answer to the pending BC message.
  if (
    isCompleted &&
    vipClient.awaitingReplySince !== null &&
    Date.parse(startedAt) >= Date.parse(vipClient.awaitingReplySince)
  ) {
    await endReplyWait({
      client,
      vipClientId: vipClient.id,
      awaitingReplySince: vipClient.awaitingReplySince,
      reason: 'Meeting held',
      at: startedAt,
    });
  } else if (isCompleted) {
    await recomputeClientStatus({ client, vipClientId: vipClient.id });
  }

  return { activityId: activity.id, isNew };
};
