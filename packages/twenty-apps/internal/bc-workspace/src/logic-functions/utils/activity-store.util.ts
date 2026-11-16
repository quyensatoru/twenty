import { type ApiClient } from '../../types/api-client';
import {
  type ActivityDirection,
  type ActivityTopic,
  type ActivityType,
  type BcActivityRecord,
  type MeetingStatus,
} from '../../types/bc-records';
import { createOrReadExisting } from './automation-unique.util';
import { BC_ACTIVITY_SELECTION } from './record-selections';
import { createRecord, findFirstRecord } from './record-store.util';

export type ActivityInput = {
  vipClientId: string | null;
  type: ActivityType;
  title: string;
  summary?: string | null;
  direction?: ActivityDirection;
  topic?: ActivityTopic;
  meetingStatus?: MeetingStatus | null;
  isBcAuthored?: boolean;
  actorMemberId?: string | null;
  occurredAt?: string;
  appName?: string | null;
  externalId?: string | null;
  sourceUrl?: string | null;
  developerIssueId?: string | null;
  metadata?: Record<string, unknown> | null;
};

// Idempotent on externalId: the same Crisp message, meeting or webhook seen
// twice stays one timeline entry and one metric event.
export const recordActivity = async (
  client: ApiClient,
  input: ActivityInput,
): Promise<{ activity: BcActivityRecord; isNew: boolean }> => {
  const externalId =
    typeof input.externalId === 'string' && input.externalId.length > 0
      ? input.externalId
      : null;
  const readExisting = () =>
    externalId === null
      ? Promise.resolve(null)
      : findFirstRecord<BcActivityRecord>({
          client,
          objectNamePlural: 'bcActivities',
          filter: { externalId: { eq: externalId } },
          selection: BC_ACTIVITY_SELECTION,
        });
  const existing = await readExisting();

  if (existing !== null) {
    return { activity: existing, isNew: false };
  }

  const { record, isNew } = await createOrReadExisting({
    readExisting,
    create: () => createActivity(client, input, externalId),
  });

  return { activity: record, isNew };
};

const createActivity = (
  client: ApiClient,
  input: ActivityInput,
  externalId: string | null,
): Promise<BcActivityRecord> =>
  createRecord<BcActivityRecord>({
    client,
    objectNameSingular: 'bcActivity',
    data: {
      vipClientId: input.vipClientId,
      activityType: input.type,
      title: input.title.slice(0, 250),
      summary: input.summary ?? null,
      direction: input.direction ?? 'INTERNAL',
      topic: input.topic ?? 'GENERAL',
      meetingStatus: input.meetingStatus ?? null,
      isBcAuthored: input.isBcAuthored ?? false,
      actorMemberId: input.actorMemberId ?? null,
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      appName: input.appName ?? null,
      externalId,
      sourceUrl: input.sourceUrl ?? null,
      developerIssueId: input.developerIssueId ?? null,
      metadata: input.metadata ?? null,
    },
    selection: BC_ACTIVITY_SELECTION,
  });
