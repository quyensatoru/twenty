import { isNonEmptyString } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_SEARCH_SELECTION,
  ISSUE_STATUS_SELECTION,
} from '../constants/record-selections';
import {
  TASK_TODAY_LOGIC_FUNCTION_UID,
  TASK_TODAY_PAGE_SIZE,
  TASK_TODAY_ROUTE_PATH,
  TASK_TODAY_SECTIONS,
} from '../constants/task-today';
import {
  type TaskTodayData,
  type TaskTodaySection,
  type TaskTodayWindow,
} from '../types/task-today';
import {
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
} from '../types/task-manager-rows';
import {
  readTaskTodayDate,
  readTaskTodayWindow,
} from '../utils/task-today-date.util';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { buildTaskTodayFilters } from './utils/build-task-today-filters.util';
import { listVisibleDiscussionNotifications } from './utils/discussion-storage.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { readPersonalBoardPreferencesForMember } from './utils/personal-board-storage.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type TaskTodayBody = Partial<TaskTodayWindow> & {
  day?: string;
  section?: TaskTodaySection;
  after?: string;
};
type TodayConnection = {
  edges?: { node: IssueRow }[];
  totalCount?: number;
  pageInfo?: { endCursor?: string | null; hasNextPage?: boolean };
};

const handler = async (event: RoutePayload<TaskTodayBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const day = readTaskTodayDate(event.body?.day);
    const window = readTaskTodayWindow(event.body ?? {});
    const section = event.body?.section ?? 'overdue';
    if (!TASK_TODAY_SECTIONS.includes(section)) {
      throw new Error('Unknown Today section.');
    }
    const empty = {
      day,
      section,
      hasMember: scope.workspaceMemberId !== null,
      memberId: scope.workspaceMemberId,
      issues: [],
      projects: [],
      issueStatuses: [],
      counts: {
        overdue: 0,
        today: 0,
        upcoming: 0,
        inProgress: 0,
        noDueDate: 0,
        recentlyDone: 0,
      },
      notifications: [],
      unreadCount: 0,
      endCursor: null,
      hasNextPage: false,
    };
    // A machine token can bypass scope, but has no personal work queue.
    if (scope.workspaceMemberId === null) return empty;
    const visibleProjectIds = await listVisibleProjectIds({
      client,
      scope,
      operation: 'read',
    });
    if (visibleProjectIds?.length === 0) return empty;

    const [projects, issueStatuses, boardPreferences] = await Promise.all([
      listScopedRecords<ProjectRow>({
        client,
        pluralName: 'projects',
        filter: buildProjectScopeFilter(visibleProjectIds, 'id'),
        selection: { id: true, name: true, key: true, appId: true },
      }),
      listScopedRecords<IssueStatusRow>({
        client,
        pluralName: 'issueStatuses',
        filter: buildProjectScopeFilter(visibleProjectIds),
        selection: ISSUE_STATUS_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
      readPersonalBoardPreferencesForMember(client, scope.workspaceMemberId),
    ]);
    const filters = buildTaskTodayFilters({
      memberId: scope.workspaceMemberId,
      visibleProjectIds,
      issueStatuses,
      window,
      now: new Date(),
    });
    const [connections, notifications] = await Promise.all([
      Promise.all(
        TASK_TODAY_SECTIONS.map(async (currentSection) => {
          const isSelected = currentSection === section;
          const result = await client.query({
            issues: {
              __args: {
                filter: filters[currentSection],
                first: isSelected ? TASK_TODAY_PAGE_SIZE : 1,
                ...(isSelected
                  ? {
                      orderBy:
                        currentSection === 'recentlyDone'
                          ? [
                              { updatedAt: 'DescNullsLast' },
                              { id: 'AscNullsLast' },
                            ]
                          : [
                              { dueDate: 'AscNullsLast' },
                              { id: 'AscNullsLast' },
                            ],
                      ...(isNonEmptyString(event.body?.after)
                        ? { after: event.body.after }
                        : {}),
                    }
                  : {}),
              },
              totalCount: true,
              ...(isSelected
                ? {
                    edges: {
                      node: {
                        ...ISSUE_SEARCH_SELECTION,
                        description: { markdown: true },
                      },
                    },
                    pageInfo: { endCursor: true, hasNextPage: true },
                  }
                : {}),
            },
          });
          return (result?.issues ?? {}) as TodayConnection;
        }),
      ),
      listVisibleDiscussionNotifications(client, scope),
    ]);
    const selectedConnection =
      connections[TASK_TODAY_SECTIONS.indexOf(section)];
    const unread = notifications.filter(
      (notification) => notification.readAt == null,
    );
    const payload: Omit<TaskTodayData, 'success'> = {
      day,
      section,
      hasMember: true,
      memberId: scope.workspaceMemberId,
      boardPreferences,
      issues: (selectedConnection.edges ?? []).map((edge) => edge.node),
      projects: projects.map((project) => ({
        ...project,
        canWrite: hasAppGrant(scope, project.appId ?? null, 'write'),
      })),
      issueStatuses,
      counts: Object.fromEntries(
        TASK_TODAY_SECTIONS.map((key, index) => [
          key,
          connections[index].totalCount ?? 0,
        ]),
      ) as TaskTodayData['counts'],
      notifications: unread.slice(0, 5),
      unreadCount: unread.length,
      endCursor: selectedConnection.pageInfo?.endCursor ?? null,
      hasNextPage: selectedConnection.pageInfo?.hasNextPage === true,
    };
    return payload;
  });

export default defineLogicFunction({
  universalIdentifier: TASK_TODAY_LOGIC_FUNCTION_UID,
  name: 'task-today',
  description:
    'Personal work queue and unread discussions across accessible projects.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: TASK_TODAY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
