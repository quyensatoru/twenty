import { type ApiClient } from '../../types/api-client';
import {
  type BcActivityRecord,
  type BcIssueRecord,
  type BcOpportunityRecord,
  type BcTaskRecord,
} from '../../types/bc-records';
import { type BcScope } from '../../types/bc-scope';
import { type TaskDetail, type TaskDeveloperTaskLink } from '../../types/tasks';
import { listAllRecords } from './list-all-records.util';
import { findFirstRecord } from './record-store.util';
import { BC_TASK_SELECTION } from './record-selections';
import {
  canEditTask,
  canSeeTask,
  loadClientSummaries,
} from './task-scope.util';
import {
  indexMemberNames,
  listWorkspaceMembers,
} from './workspace-members.util';

export const loadScopedTask = async ({
  client,
  scope,
  taskId,
}: {
  client: ApiClient;
  scope: BcScope;
  taskId: string;
}): Promise<BcTaskRecord> => {
  const task = await findFirstRecord<BcTaskRecord>({
    client,
    objectNamePlural: 'bcTasks',
    filter: { id: { eq: taskId } },
    selection: BC_TASK_SELECTION,
  });

  if (task === null) {
    throw new Error('This task no longer exists.');
  }

  if (!canSeeTask(scope, task)) {
    throw new Error('You do not have access to this task.');
  }

  return task;
};

const DEVELOPER_TASK_LIMIT = 20;

// Developer tickets filed from the client profile for this task's issue, or
// for its client when the task follows no issue.
const listDeveloperTasks = async (
  client: ApiClient,
  task: BcTaskRecord,
): Promise<TaskDeveloperTaskLink[]> => {
  if (task.vipClientId === null) {
    return [];
  }

  const activities = await listAllRecords<
    Pick<BcActivityRecord, 'id' | 'title' | 'appName' | 'developerIssueId' | 'metadata' | 'occurredAt' | 'createdAt'>
  >({
    client,
    pluralName: 'bcActivities',
    filter: {
      vipClientId: { eq: task.vipClientId },
      activityType: { eq: 'DEVELOPER_TASK' },
    },
    selection: {
      id: true,
      title: true,
      appName: true,
      developerIssueId: true,
      metadata: true,
      occurredAt: true,
      createdAt: true,
    },
    orderBy: [{ occurredAt: 'DescNullsLast' }],
    maxRecords: 200,
  });

  return activities
    .filter(
      (activity) =>
        activity.developerIssueId !== null &&
        (task.issueId === null || activity.metadata?.bcIssueId === task.issueId),
    )
    .slice(0, DEVELOPER_TASK_LIMIT)
    .map((activity) => ({
      activityId: activity.id,
      developerIssueId: activity.developerIssueId as string,
      title: (activity.title ?? '').replace(/^Developer task created: /, ''),
      appName: activity.appName,
      createdAt: activity.occurredAt ?? activity.createdAt,
    }));
};

export const buildTaskDetail = async ({
  client,
  scope,
  task,
}: {
  client: ApiClient;
  scope: BcScope;
  task: BcTaskRecord;
}): Promise<TaskDetail> => {
  const [members, clients, issue, opportunity, developerTasks] = await Promise.all([
    listWorkspaceMembers(client),
    loadClientSummaries(client, task.vipClientId === null ? [] : [task.vipClientId]),
    task.issueId === null
      ? Promise.resolve(null)
      : findFirstRecord<Pick<BcIssueRecord, 'id' | 'title' | 'status'>>({
          client,
          objectNamePlural: 'bcIssues',
          filter: { id: { eq: task.issueId } },
          selection: { id: true, title: true, status: true },
        }),
    task.opportunityId === null
      ? Promise.resolve(null)
      : findFirstRecord<BcOpportunityRecord>({
          client,
          objectNamePlural: 'bcOpportunities',
          filter: { id: { eq: task.opportunityId } },
          selection: {
            id: true,
            appName: true,
            planCode: true,
            billingCycle: true,
            usagePercent: true,
            status: true,
          },
        }),
    listDeveloperTasks(client, task),
  ]);
  const memberNames = indexMemberNames(members);

  return {
    id: task.id,
    title: task.title ?? '',
    notes: task.notes,
    category: task.category,
    customCategory: task.customCategory,
    status: task.status,
    priority: task.priority,
    source: task.source,
    triggerType: task.triggerType,
    outcome: task.outcome,
    outcomeStatus: task.outcomeStatus,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    appName: task.appName,
    ownerId: task.ownerId,
    ownerName: task.ownerId === null ? null : (memberNames.get(task.ownerId) ?? null),
    vipClient: task.vipClientId === null ? null : (clients.get(task.vipClientId) ?? null),
    issue,
    opportunity:
      opportunity === null
        ? null
        : {
            id: opportunity.id,
            appName: opportunity.appName,
            plan: opportunity.planCode,
            billingCycle: opportunity.billingCycle,
            usagePercent: opportunity.usagePercent,
            status: opportunity.status,
          },
    developerTasks,
    history: (Array.isArray(task.history) ? task.history : [])
      .map((entry) => ({
        ...entry,
        actorName:
          entry.actorMemberId === null
            ? null
            : (memberNames.get(entry.actorMemberId) ?? null),
      }))
      .reverse(),
    canEdit: canEditTask(scope, task),
  };
};
