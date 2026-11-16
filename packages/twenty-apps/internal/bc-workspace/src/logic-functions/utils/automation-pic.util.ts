import { type ApiClient } from '../../types/api-client';
import { type BcTaskRecord, type VipClientRecord } from '../../types/bc-records';
import { appendHistory } from '../../utils/history.util';
import {
  buildNewVipTaskKey,
  buildPicChangeKey,
} from '../../utils/trigger-keys.util';
import { recordActivity } from './activity-store.util';
import { upsertAutoTask } from './auto-task.util';
import { listAllRecords } from './list-all-records.util';
import { BC_TASK_SELECTION } from './record-selections';
import { updateRecord } from './record-store.util';
import { listWorkspaceMembers } from './workspace-members.util';

export type PicChangeInput = {
  client: ApiClient;
  vipClient: VipClientRecord;
  fromMemberId: string | null;
  toMemberId: string | null;
  fromTeamId: string | null;
  toTeamId: string | null;
  actorMemberId: string | null;
  // When the change happened; also what makes a re-delivered event a no-op.
  effectiveAt: string;
};

// Past activity keeps its actor, so earlier outcomes stay credited to the BC
// who earned them. The open work the previous PIC held on this client moves
// to the new one; unassigning leaves it with its owner until someone takes
// the client. The PIC_CHANGE entry is the assignment history analytics reads.
export const handlePicChange = async ({
  client,
  vipClient,
  fromMemberId,
  toMemberId,
  fromTeamId,
  toTeamId,
  actorMemberId,
  effectiveAt,
}: PicChangeInput): Promise<{ reassignedTaskCount: number; isNew: boolean }> => {
  if (fromMemberId === toMemberId) {
    return { reassignedTaskCount: 0, isNew: false };
  }

  const memberNames = new Map(
    (await listWorkspaceMembers(client)).map((member) => [member.id, member.name]),
  );
  const readName = (memberId: string | null) =>
    memberId === null ? 'nobody' : (memberNames.get(memberId) ?? 'a former member');

  const { isNew } = await recordActivity(client, {
    vipClientId: vipClient.id,
    type: 'PIC_CHANGE',
    title: `PIC changed from ${readName(fromMemberId)} to ${readName(toMemberId)}`,
    direction: 'INTERNAL',
    actorMemberId,
    occurredAt: effectiveAt,
    externalId: buildPicChangeKey(vipClient.id, effectiveAt),
    metadata: { fromMemberId, toMemberId, fromTeamId, toTeamId, effectiveAt },
  });

  await updateRecord({
    client,
    objectNameSingular: 'vipClient',
    id: vipClient.id,
    data: { assignedAt: toMemberId === null ? null : effectiveAt },
  });

  const openTasks = await listAllRecords<BcTaskRecord>({
    client,
    pluralName: 'bcTasks',
    filter: {
      vipClientId: { eq: vipClient.id },
      status: { in: ['TODO', 'IN_PROGRESS'] },
    },
    selection: BC_TASK_SELECTION,
  });
  // The previous PIC's tasks, plus automatic ones nobody owned yet.
  const handedOver = openTasks.filter(
    (task) =>
      (fromMemberId !== null && task.ownerId === fromMemberId) ||
      (task.ownerId === null && task.source === 'AUTO'),
  );
  const handoverNote = `PIC change at ${effectiveAt}`;
  let reassignedTaskCount = 0;

  for (const task of handedOver) {
    if ((task.history ?? []).some((entry) => entry.note === handoverNote)) {
      continue;
    }

    if (toMemberId === null) {
      await updateRecord({
        client,
        objectNameSingular: 'bcTask',
        id: task.id,
        data: {
          history: appendHistory(task.history, {
            actorMemberId,
            action: 'NOTE',
            note: handoverNote,
            at: effectiveAt,
          }),
        },
      });
      continue;
    }

    await updateRecord({
      client,
      objectNameSingular: 'bcTask',
      id: task.id,
      data: {
        ownerId: toMemberId,
        history: appendHistory(task.history, {
          actorMemberId,
          action: 'REASSIGNED',
          from: task.ownerId,
          to: toMemberId,
          note: handoverNote,
          at: effectiveAt,
        }),
      },
    });
    reassignedTaskCount += 1;
  }

  if (fromMemberId === null && toMemberId !== null) {
    await upsertAutoTask(client, {
      triggerKey: buildNewVipTaskKey(vipClient.id, toMemberId),
      triggerType: 'NEW_VIP',
      vipClientId: vipClient.id,
      ownerId: toMemberId,
      title: `Welcome ${vipClient.name ?? vipClient.shopDomain ?? 'new VIP client'} and plan onboarding`,
      category: 'ONBOARDING',
      priority: 'MEDIUM',
    });
  }

  return { reassignedTaskCount, isNew };
};
