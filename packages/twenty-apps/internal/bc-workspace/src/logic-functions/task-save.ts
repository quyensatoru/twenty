import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { TASK_SAVE_ROUTE_PATH } from '../constants/route-paths';
import { TASK_SAVE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type BcTaskRecord,
  type TaskCategory,
  type TaskOutcomeStatus,
  type TaskPriority,
  type TaskStatus,
} from '../types/bc-records';
import { type TaskDetailResult, type TaskSaveRequest } from '../types/tasks';
import { appendHistory } from '../utils/history.util';
import {
  applyStatusTransition,
  normalizeTaskDraft,
  validateTaskDraft,
} from '../utils/task-rules.util';
import { recordActivity } from './utils/activity-store.util';
import { readVipClient } from './utils/client-store.util';
import { BC_TASK_SELECTION } from './utils/record-selections';
import { createRecord, updateRecord } from './utils/record-store.util';
import { canSeeClientOf } from './utils/resolve-bc-scope.util';
import { runBcRoute } from './utils/run-bc-route.util';
import {
  buildTaskDetail,
  loadScopedTask,
} from './utils/task-detail-store.util';
import { canEditTask } from './utils/task-scope.util';

const CATEGORIES: TaskCategory[] = [
  'CLIENT_ISSUE',
  'FOLLOW_UP',
  'UPSELL',
  'ONBOARDING',
  'RETENTION',
  'OTHER',
];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const OUTCOME_STATUSES: TaskOutcomeStatus[] = [
  'PENDING',
  'CONTACTED',
  'CONVERTED',
  'NOT_INTERESTED',
  'NOT_QUALIFIED',
];

const pick = <TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  fallback: TValue,
): TValue =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as TValue)
    : fallback;

// A field left out keeps its stored value, so the table can change only the
// status without sending the whole task back.
const readText = (value: unknown, stored: string | null | undefined): string =>
  typeof value === 'string' ? value : (stored ?? '');

const CHANGE_FIELDS = [
  'title',
  'notes',
  'category',
  'customCategory',
  'priority',
  'outcome',
  'outcomeStatus',
  'vipClientId',
] as const;

const handler = async (event: RoutePayload<Partial<TaskSaveRequest>>) =>
  runBcRoute(async ({ client, scope }) => {
    const body = event.body ?? {};
    const taskId = typeof body.taskId === 'string' && body.taskId.length > 0 ? body.taskId : null;
    const existing =
      taskId === null ? null : await loadScopedTask({ client, scope, taskId });

    if (existing !== null && !canEditTask(scope, existing)) {
      throw new Error('Only the owner of this task can change it.');
    }

    if (existing === null && scope.role === 'NONE') {
      throw new Error('You are not in a BC team yet.');
    }

    const draft = {
      title: readText(body.title, existing?.title),
      notes: readText(body.notes, existing?.notes),
      category: pick(body.category, CATEGORIES, existing?.category ?? 'FOLLOW_UP'),
      customCategory: readText(body.customCategory, existing?.customCategory),
      priority: pick(body.priority, PRIORITIES, existing?.priority ?? 'MEDIUM'),
      status: pick(body.status, STATUSES, existing?.status ?? 'TODO'),
      outcome: readText(body.outcome, existing?.outcome),
      outcomeStatus:
        typeof body.outcomeStatus === 'string'
          ? pick(body.outcomeStatus, OUTCOME_STATUSES, 'PENDING')
          : body.outcomeStatus === undefined
            ? (existing?.outcomeStatus ?? null)
            : null,
    };
    const errors = validateTaskDraft(draft);
    const firstError = Object.values(errors)[0];

    if (firstError !== undefined) {
      throw new Error(firstError);
    }

    const vipClientId =
      body.vipClientId === undefined
        ? (existing?.vipClientId ?? null)
        : typeof body.vipClientId === 'string' && body.vipClientId.length > 0
          ? body.vipClientId
          : null;

    if (vipClientId !== null && vipClientId !== existing?.vipClientId) {
      const vipClient = await readVipClient(client, vipClientId);

      if (vipClient === null || !canSeeClientOf(scope, vipClient.picId, vipClient.teamId)) {
        throw new Error('You do not have access to this client.');
      }
    }

    const now = new Date().toISOString();
    const normalized = normalizeTaskDraft(draft);
    const transition = applyStatusTransition({
      previousStatus: existing?.status ?? null,
      nextStatus: normalized.status,
      previousCompletedAt: existing?.completedAt ?? null,
      history: existing?.history ?? null,
      actorMemberId: scope.workspaceMemberId,
      now,
    });
    const data: Record<string, unknown> = {
      ...normalized,
      vipClientId,
      appName:
        typeof body.appName === 'string' && body.appName.length > 0
          ? body.appName
          : (existing?.appName ?? null),
      completedAt: transition.completedAt,
    };

    let task: BcTaskRecord;

    if (existing === null) {
      task = await createRecord<BcTaskRecord>({
        client,
        objectNameSingular: 'bcTask',
        data: {
          ...data,
          source: 'MANUAL',
          ownerId: scope.workspaceMemberId,
          history: transition.history,
        },
        selection: BC_TASK_SELECTION,
      });

      if (vipClientId !== null) {
        await recordActivity(client, {
          vipClientId,
          type: 'TASK',
          title: `Task created: ${normalized.title}`,
          direction: 'INTERNAL',
          actorMemberId: scope.workspaceMemberId,
          occurredAt: now,
          metadata: { taskId: task.id },
        });
      }
    } else {
      const changedFields = CHANGE_FIELDS.filter(
        (field) => (data[field] ?? null) !== (existing[field] ?? null),
      );
      const history =
        changedFields.length === 0
          ? transition.history
          : appendHistory(transition.history, {
              actorMemberId: scope.workspaceMemberId,
              action: 'UPDATED',
              note: changedFields.join(', '),
              at: now,
            });

      task = await updateRecord<BcTaskRecord>({
        client,
        objectNameSingular: 'bcTask',
        id: existing.id,
        data: { ...data, history },
        selection: BC_TASK_SELECTION,
      });
    }

    // Completing an issue follow-up never closes the issue itself: only an
    // explicit BC confirmation on the client does.
    if (transition.isNewlyCompleted && task.vipClientId !== null) {
      await recordActivity(client, {
        vipClientId: task.vipClientId,
        type: 'TASK',
        title: `Task completed: ${task.title ?? ''}`,
        summary: task.outcome,
        direction: 'INTERNAL',
        actorMemberId: scope.workspaceMemberId,
        occurredAt: now,
        appName: task.appName,
        metadata: { taskId: task.id, category: task.category },
      });
    }

    const result: TaskDetailResult = {
      task: await buildTaskDetail({ client, scope, task }),
    };

    return result;
  });

export default defineLogicFunction({
  universalIdentifier: TASK_SAVE_LOGIC_FUNCTION_UID,
  name: 'bc-task-save',
  description:
    'Route: creates a manual BC task or updates one the caller owns, keeping its history.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: TASK_SAVE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
