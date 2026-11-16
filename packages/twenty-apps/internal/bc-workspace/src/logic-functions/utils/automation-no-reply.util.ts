import { type ApiClient } from '../../types/api-client';
import { appendHistory } from '../../utils/history.util';
import { buildNoReplyTaskKey } from '../../utils/trigger-keys.util';
import { readTaskByTriggerKey } from './auto-task.util';
import { recomputeClientStatus } from './recompute-client-status.util';
import { updateRecord } from './record-store.util';

// The client answered (or a meeting was held), so the BC message is no
// longer pending. The follow-up task the wait produced closes if nobody has
// started it; one already in progress only gets a note, since the BC may still
// have something to do.
export const endReplyWait = async ({
  client,
  vipClientId,
  awaitingReplySince,
  reason,
  at,
}: {
  client: ApiClient;
  vipClientId: string;
  awaitingReplySince: string;
  reason: 'Client replied' | 'Meeting held';
  at: string;
}): Promise<void> => {
  await updateRecord({
    client,
    objectNameSingular: 'vipClient',
    id: vipClientId,
    data: { awaitingReplySince: null },
  });

  const task = await readTaskByTriggerKey(
    client,
    buildNoReplyTaskKey(vipClientId, awaitingReplySince),
  );

  if (task !== null && (task.status === 'TODO' || task.status === 'IN_PROGRESS')) {
    const shouldComplete = task.status === 'TODO';

    await updateRecord({
      client,
      objectNameSingular: 'bcTask',
      id: task.id,
      data: {
        ...(shouldComplete
          ? { status: 'COMPLETED', completedAt: at, outcome: task.outcome ?? reason }
          : {}),
        history: appendHistory(task.history, {
          actorMemberId: null,
          action: shouldComplete ? 'STATUS_CHANGED' : 'NOTE',
          from: shouldComplete ? task.status : null,
          to: shouldComplete ? 'COMPLETED' : null,
          note: reason,
          at,
        }),
      },
    });
  }

  await recomputeClientStatus({ client, vipClientId });
};
