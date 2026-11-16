import { type ApiClient } from '../../types/api-client';
import {
  type BcTaskRecord,
  type TaskCategory,
  type TaskPriority,
  type TaskTriggerType,
} from '../../types/bc-records';
import { appendHistory } from '../../utils/history.util';
import { recordActivity } from './activity-store.util';
import { createOrReadExisting } from './automation-unique.util';
import { BC_TASK_SELECTION } from './record-selections';
import {
  createRecord,
  findFirstRecord,
  updateRecord,
} from './record-store.util';

export type AutoTaskInput = {
  triggerKey: string;
  triggerType: TaskTriggerType;
  vipClientId: string;
  ownerId: string | null;
  title: string;
  notes?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  appName?: string | null;
  issueId?: string | null;
  opportunityId?: string | null;
};

const PRIORITY_RANK: Record<TaskPriority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

const escalateIfHigher = async (
  client: ApiClient,
  existing: BcTaskRecord,
  input: AutoTaskInput,
): Promise<{ task: BcTaskRecord; outcome: 'escalated' | 'unchanged' }> => {
  const isOpen = existing.status === 'TODO' || existing.status === 'IN_PROGRESS';

  if (!isOpen || PRIORITY_RANK[input.priority] <= PRIORITY_RANK[existing.priority]) {
    return { task: existing, outcome: 'unchanged' };
  }

  const task = await updateRecord<BcTaskRecord>({
    client,
    objectNameSingular: 'bcTask',
    id: existing.id,
    data: {
      priority: input.priority,
      notes: input.notes ?? existing.notes,
      history: appendHistory(existing.history, {
        actorMemberId: null,
        action: 'ESCALATED',
        from: existing.priority,
        to: input.priority,
        note: input.title,
      }),
    },
    selection: BC_TASK_SELECTION,
  });

  return { task, outcome: 'escalated' };
};

export const readTaskByTriggerKey = (
  client: ApiClient,
  triggerKey: string,
): Promise<BcTaskRecord | null> =>
  findFirstRecord<BcTaskRecord>({
    client,
    objectNamePlural: 'bcTasks',
    filter: { triggerKey: { eq: triggerKey } },
    selection: BC_TASK_SELECTION,
  });

// One task per trigger key. A repeated event can only raise the priority of
// the task already there (the BLOY 100% escalation); it never adds a second
// task, and a task the BC closed stays closed. Safe to call again after a
// partial failure: the task-created timeline entry is keyed too.
export const upsertAutoTask = async (
  client: ApiClient,
  input: AutoTaskInput,
): Promise<{ task: BcTaskRecord; outcome: 'created' | 'escalated' | 'unchanged' }> => {
  const existing = await readTaskByTriggerKey(client, input.triggerKey);

  if (existing !== null) {
    await recordTaskCreated(client, existing, input);

    return escalateIfHigher(client, existing, input);
  }

  const { record: task, isNew } = await createOrReadExisting({
    readExisting: () => readTaskByTriggerKey(client, input.triggerKey),
    create: () =>
      createRecord<BcTaskRecord>({
        client,
        objectNameSingular: 'bcTask',
        data: {
          title: input.title.slice(0, 250),
          notes: input.notes ?? null,
          category: input.category,
          status: 'TODO',
          priority: input.priority,
          source: 'AUTO',
          triggerType: input.triggerType,
          triggerKey: input.triggerKey,
          appName: input.appName ?? null,
          ownerId: input.ownerId,
          vipClientId: input.vipClientId,
          issueId: input.issueId ?? null,
          opportunityId: input.opportunityId ?? null,
          history: appendHistory(null, {
            actorMemberId: null,
            action: 'CREATED',
            to: 'TODO',
            note: input.triggerType,
          }),
        },
        selection: BC_TASK_SELECTION,
      }),
  });

  await recordTaskCreated(client, task, input);

  if (!isNew) {
    return escalateIfHigher(client, task, input);
  }

  return { task, outcome: 'created' };
};

const recordTaskCreated = async (
  client: ApiClient,
  task: BcTaskRecord,
  input: AutoTaskInput,
): Promise<void> => {
  await recordActivity(client, {
    vipClientId: input.vipClientId,
    type: 'TASK',
    title: `Task created: ${task.title ?? input.title}`,
    direction: 'INTERNAL',
    occurredAt: task.createdAt,
    externalId: `task-created:${task.id}`,
    metadata: { taskId: task.id, triggerType: input.triggerType },
  });
};
