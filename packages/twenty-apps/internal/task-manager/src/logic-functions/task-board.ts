import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { BOARD_COLUMN_PAGE_SIZE } from '../constants/board-column-page-size';
import {
  EPIC_SELECTION,
  ISSUE_STATUS_SELECTION,
  PROJECT_SELECTION,
  SPRINT_SELECTION,
} from '../constants/record-selections';
import { TASK_BOARD_ROUTE_PATH } from '../constants/route-paths';
import { TASK_BOARD_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type Connection } from '../types/connection';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import {
  buildBoardColumnFilter,
  buildBoardHiddenDoneFilter,
  buildBoardScopeFilter,
} from './utils/build-board-issue-filters.util';
import { fetchIssuePage } from './utils/fetch-issue-page.util';
import { listAppMembers } from './utils/list-app-members.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import {
  type BoardIssueQueryBody,
  readBoardIssueQuery,
} from './utils/read-board-issue-query.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type TaskBoardBody = BoardIssueQueryBody & { projectId?: string };

// The key a column's page travels under: its status id, or this for the
// issues with no status.
const NO_STATUS_COLUMN_KEY = 'NO_STATUS';

// A count, not a read: the board only says how many older done issues there
// are until the reader asks to see them.
const countIssues = async (
  client: ApiClient,
  filter: Record<string, unknown>,
): Promise<number> => {
  const result = await client.query({
    issues: { __args: { filter, first: 1 }, totalCount: true },
  });

  return (result?.issues as Connection<unknown> | undefined)?.totalCount ?? 0;
};

const EMPTY_BOARD = {
  projects: [],
  activeProjectId: null,
  issueStatuses: [],
  sprints: [],
  epics: [],
  issues: [],
  columnPages: {},
  members: [],
  assignableMembers: [],
  hiddenDoneIssueCount: 0,
  canWrite: false,
  canSoftDelete: false,
  canManageViews: false,
};

// One round trip for the whole board: the visible projects, the active
// project's statuses / sprints / epics, the first page of each column, and the
// members its cards have to label. Later pages come from board-column-issues. Every read narrows to the caller's visible-project set,
// so a board can never leak a project the caller has no grant for — and a
// requested project outside that set falls back to the first visible one
// rather than failing the page.
const handler = async (event: RoutePayload<TaskBoardBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const visibleProjectIds = await listVisibleProjectIds({
      client,
      scope,
      operation: 'read',
    });

    if (visibleProjectIds !== null && visibleProjectIds.length === 0) {
      return { ...EMPTY_BOARD, currentWorkspaceMemberId: scope.workspaceMemberId };
    }

    const projects = await listScopedRecords({
      client,
      pluralName: 'projects',
      filter: buildProjectScopeFilter(visibleProjectIds, 'id'),
      selection: PROJECT_SELECTION,
      orderBy: [{ name: 'AscNullsLast' }],
    });

    if (projects.length === 0) {
      return { ...EMPTY_BOARD, currentWorkspaceMemberId: scope.workspaceMemberId };
    }

    const requestedProjectId =
      typeof event.body?.projectId === 'string' ? event.body.projectId : null;
    const requestedIsVisible =
      requestedProjectId !== null &&
      (visibleProjectIds === null ||
        visibleProjectIds.includes(requestedProjectId));
    const projectIds = new Set(
      projects.map((project) => (project as { id: string }).id),
    );
    const activeProjectId =
      requestedIsVisible && projectIds.has(requestedProjectId as string)
        ? (requestedProjectId as string)
        : (projects[0] as { id: string }).id;
    const activeProjectAppId =
      (
        projects.find(
          (project) => (project as { id: string }).id === activeProjectId,
        ) as { appId?: string | null } | undefined
      )?.appId ?? null;

    const query = readBoardIssueQuery(activeProjectId, event.body);
    const scopeFilter = buildBoardScopeFilter(query);
    const now = new Date();

    const [issueStatuses, sprints, epics, assignableMembers] =
      await Promise.all([
        listScopedRecords<{ id: string; category?: string | null }>({
          client,
          pluralName: 'issueStatuses',
          filter: { projectId: { eq: activeProjectId } },
          selection: ISSUE_STATUS_SELECTION,
          orderBy: [{ position: 'AscNullsLast' }],
        }),
        listScopedRecords({
          client,
          pluralName: 'sprints',
          filter: { projectId: { eq: activeProjectId } },
          selection: SPRINT_SELECTION,
          orderBy: [{ position: 'AscNullsLast' }],
        }),
        listScopedRecords({
          client,
          pluralName: 'epics',
          filter: { projectId: { eq: activeProjectId } },
          selection: EPIC_SELECTION,
          orderBy: [{ position: 'AscNullsLast' }],
        }),
        // The faces of the board's assignee filter: everyone who can work on
        // the project, not just whoever owns a card that happened to load.
        activeProjectAppId === null
          ? Promise.resolve([])
          : listAppMembers({ client, appId: activeProjectAppId }),
      ]);

    // Statuses first, issues second: which statuses count as done decides
    // each column's filter. Then one first page per column, side by side, so
    // a column only ever costs what fits on screen until it is scrolled.
    const columns = [
      ...issueStatuses.map((status) => ({
        key: status.id,
        statusId: status.id as string | null,
        isDoneStatus: status.category === 'DONE',
      })),
      { key: NO_STATUS_COLUMN_KEY, statusId: null, isDoneStatus: false },
    ];
    const hiddenDoneFilter = buildBoardHiddenDoneFilter({
      scopeFilter,
      doneStatusIds: issueStatuses
        .filter((status) => status.category === 'DONE')
        .map((status) => status.id),
      shouldIncludeOlderDone: query.shouldIncludeOlderDone,
      now,
    });

    const [columnPageList, hiddenDoneIssueCount] = await Promise.all([
      Promise.all(
        columns.map((column) =>
          fetchIssuePage({
            client,
            filter: buildBoardColumnFilter({
              scopeFilter,
              statusId: column.statusId,
              isDoneStatus: column.isDoneStatus,
              shouldIncludeOlderDone: query.shouldIncludeOlderDone,
              now,
            }),
            first: BOARD_COLUMN_PAGE_SIZE,
          }),
        ),
      ),
      hiddenDoneFilter === null
        ? Promise.resolve(0)
        : countIssues(client, hiddenDoneFilter),
    ]);

    const issues = columnPageList.flatMap((page) => page.issues);
    const columnPages = Object.fromEntries(
      columns.map((column, index) => {
        const page = columnPageList[index];

        return [
          column.key,
          {
            totalCount: page?.totalCount ?? 0,
            endCursor: page?.endCursor ?? null,
            hasNextPage: page?.hasNextPage === true,
          },
        ];
      }),
    );

    const members = await listIssueMembers({ client, issues });

    return {
      projects,
      activeProjectId,
      issueStatuses,
      sprints,
      epics,
      issues,
      columnPages,
      members,
      assignableMembers,
      hiddenDoneIssueCount,
      currentWorkspaceMemberId: scope.workspaceMemberId,
      // What the board may offer on this project, by the rule its write
      // routes enforce. Only hides controls; the routes still decide.
      canWrite: hasAppGrant(scope, activeProjectAppId, 'write'),
      canSoftDelete: hasAppGrant(scope, activeProjectAppId, 'softDelete'),
      // Column order is a view everyone on the project shares, so it follows
      // the role's "Manage Views" permission rather than an app grant.
      canManageViews: scope.canManageViews,
    };
  });

export default defineLogicFunction({
  universalIdentifier: TASK_BOARD_LOGIC_FUNCTION_UID,
  name: 'task-board',
  description:
    "Route: one board round trip — visible projects plus the active project's statuses, sprints, epics, members and the first page of every column.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: TASK_BOARD_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
