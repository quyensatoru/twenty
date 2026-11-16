import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { TASK_LIST_ROUTE_PATH } from '../constants/route-paths';
import {
  TASK_CATEGORY_OPTIONS,
  TASK_SOURCE_OPTIONS,
} from '../constants/select-options';
import { TASK_LIST_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  type BcTaskRecord,
  type TaskCategory,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
} from '../types/bc-records';
import {
  type TaskKpiFilter,
  type TaskListKpis,
  type TaskListRequest,
  type TaskListResult,
  type TaskListRow,
} from '../types/tasks';
import {
  paginate,
  readSortState,
  sortRecords,
  type SortValue,
} from '../utils/sort-records.util';
import { buildCreatedRange } from '../utils/task-date-range.util';
import {
  isOpenTaskStatus,
  TASK_PRIORITY_RANK,
} from '../utils/task-rules.util';
import { listAllRecords } from './utils/list-all-records.util';
import { readBcSettings } from './utils/read-bc-settings.util';
import { BC_TASK_SELECTION } from './utils/record-selections';
import { runBcRoute } from './utils/run-bc-route.util';
import {
  buildTaskScopeFilter,
  canEditTask,
  loadClientSummaries,
} from './utils/task-scope.util';
import {
  indexMemberNames,
  listWorkspaceMembers,
} from './utils/workspace-members.util';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;
const NOTES_EXCERPT_LENGTH = 140;
const STATUS_ORDER: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

const readOption = <TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
): TValue | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as TValue)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const readRequest = (
  body: Partial<TaskListRequest> | null | undefined,
): TaskListRequest => ({
  kpi: readOption<TaskKpiFilter>(body?.kpi, ['OPEN', 'AUTOMATIC', 'COMPLETED', 'HIGH_OPEN']),
  status: readOption<TaskStatus>(body?.status, ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  category: readOption<TaskCategory>(body?.category, [
    'CLIENT_ISSUE',
    'FOLLOW_UP',
    'UPSELL',
    'ONBOARDING',
    'RETENTION',
    'OTHER',
  ]),
  source: readOption<TaskSource>(body?.source, ['MANUAL', 'AUTO']),
  priority: readOption<TaskPriority>(body?.priority, ['LOW', 'MEDIUM', 'HIGH']),
  ownerId: readString(body?.ownerId),
  vipClientId: readString(body?.vipClientId),
  createdFrom: readString(body?.createdFrom),
  createdTo: readString(body?.createdTo),
  search: readString(body?.search)?.toLowerCase() ?? '',
  sort: readSortState(body?.sort),
  page: Number(body?.page) || 1,
  pageSize: Math.min(Math.max(Number(body?.pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE),
});

const matchesKpi = (row: Pick<TaskListRow, 'status' | 'source' | 'priority'>, kpi: TaskKpiFilter | null): boolean => {
  switch (kpi) {
    case 'OPEN':
      return isOpenTaskStatus(row.status);
    case 'AUTOMATIC':
      return row.source === 'AUTO';
    case 'COMPLETED':
      return row.status === 'COMPLETED';
    case 'HIGH_OPEN':
      return row.priority === 'HIGH' && isOpenTaskStatus(row.status);
    default:
      return true;
  }
};

// Categories sort in their option order (the order the picker shows), a
// custom Other label after the built-in ones.
const readOptionPosition = (
  options: readonly { value: string; position: number }[],
  value: string,
): number => options.find((option) => option.value === value)?.position ?? options.length;

const countKpis = (tasks: BcTaskRecord[]): TaskListKpis => ({
  open: tasks.filter((task) => isOpenTaskStatus(task.status)).length,
  automatic: tasks.filter((task) => task.source === 'AUTO').length,
  completed: tasks.filter((task) => task.status === 'COMPLETED').length,
  highPriorityOpen: tasks.filter(
    (task) => task.priority === 'HIGH' && isOpenTaskStatus(task.status),
  ).length,
});

const handler = async (event: RoutePayload<Partial<TaskListRequest>>) =>
  runBcRoute(async ({ client, scope }) => {
    const request = readRequest(event.body);
    const { reportingTimezone } = readBcSettings();
    const createdRange = buildCreatedRange({
      from: request.createdFrom,
      to: request.createdTo,
      timeZone: reportingTimezone,
    });

    // Everything but status, KPI and search is filtered in the query: the
    // KPIs count the whole filtered scope, whatever the table shows.
    const filters = [
      buildTaskScopeFilter(scope),
      request.category === null ? null : { category: { eq: request.category } },
      request.source === null ? null : { source: { eq: request.source } },
      request.priority === null ? null : { priority: { eq: request.priority } },
      request.ownerId === null ? null : { ownerId: { eq: request.ownerId } },
      request.vipClientId === null ? null : { vipClientId: { eq: request.vipClientId } },
      createdRange.gte === null ? null : { createdAt: { gte: createdRange.gte } },
      createdRange.lt === null ? null : { createdAt: { lt: createdRange.lt } },
    ].filter((filter): filter is Record<string, unknown> => filter !== null);

    const [tasks, members] = await Promise.all([
      listAllRecords<BcTaskRecord>({
        client,
        pluralName: 'bcTasks',
        filter: filters.length === 0 ? undefined : { and: filters },
        selection: BC_TASK_SELECTION,
      }),
      listWorkspaceMembers(client),
    ]);
    const memberNames = indexMemberNames(members);
    const clients = await loadClientSummaries(
      client,
      tasks.flatMap((task) => (task.vipClientId === null ? [] : [task.vipClientId])),
    );

    const rows: TaskListRow[] = tasks.map((task) => ({
      id: task.id,
      title: task.title ?? '',
      notesExcerpt:
        task.notes === null || task.notes.length === 0
          ? null
          : task.notes.slice(0, NOTES_EXCERPT_LENGTH),
      vipClient: task.vipClientId === null ? null : (clients.get(task.vipClientId) ?? null),
      category: task.category,
      customCategory: task.customCategory,
      source: task.source,
      triggerType: task.triggerType,
      ownerId: task.ownerId,
      ownerName: task.ownerId === null ? null : (memberNames.get(task.ownerId) ?? null),
      priority: task.priority,
      status: task.status,
      outcomeStatus: task.outcomeStatus,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
      appName: task.appName,
      canEdit: canEditTask(scope, task),
    }));

    const matching = rows.filter(
      (row) =>
        (request.status === null || row.status === request.status) &&
        matchesKpi(row, request.kpi) &&
        (request.search.length === 0 ||
          [row.title, row.notesExcerpt, row.vipClient?.name, row.vipClient?.shopDomain, row.customCategory]
            .some((value) => (value ?? '').toLowerCase().includes(request.search))),
    );

    const readValue = (row: TaskListRow, key: string): SortValue => {
      switch (key) {
        case 'title':
          return row.title;
        case 'client':
          return row.vipClient?.name ?? row.vipClient?.shopDomain ?? null;
        case 'category':
          return `${readOptionPosition(TASK_CATEGORY_OPTIONS, row.category)}:${row.customCategory ?? ''}`;
        case 'source':
          return readOptionPosition(TASK_SOURCE_OPTIONS, row.source);
        case 'owner':
          return row.ownerName;
        case 'priority':
          return TASK_PRIORITY_RANK[row.priority];
        case 'status':
          return STATUS_ORDER[row.status];
        case 'createdAt':
          return row.createdAt;
        default:
          return null;
      }
    };

    const sorted = sortRecords(matching, request.sort, readValue, {
      key: 'createdAt',
      direction: 'DESC',
    });
    const page = paginate(sorted, request.page, request.pageSize);

    const result: TaskListResult = {
      rows: page.items,
      kpis: countKpis(tasks),
      page: page.page,
      pageCount: page.pageCount,
      total: page.total,
      scopeTotal: tasks.length,
    };

    return result;
  });

export default defineLogicFunction({
  universalIdentifier: TASK_LIST_LOGIC_FUNCTION_UID,
  name: 'bc-task-list',
  description:
    "Route: the caller's BC tasks (or their team's), filtered, sorted and paged on the server, with task KPIs.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: TASK_LIST_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
