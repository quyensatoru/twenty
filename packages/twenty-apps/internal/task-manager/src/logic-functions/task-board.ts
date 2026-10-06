import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EPIC_SELECTION,
  ISSUE_SEARCH_SELECTION,
  ISSUE_STATUS_SELECTION,
  PROJECT_SELECTION,
  SPRINT_SELECTION,
} from '../constants/record-selections';
import { TASK_BOARD_ROUTE_PATH } from '../constants/route-paths';
import { TASK_BOARD_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type IssueRow } from '../types/task-manager-rows';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type TaskBoardBody = {
  projectId?: string;
  // undefined = every sprint, null = backlog (no sprint), string = one sprint.
  sprintId?: string | null;
};

const EMPTY_BOARD = {
  projects: [],
  activeProjectId: null,
  issueStatuses: [],
  sprints: [],
  epics: [],
  issues: [],
  members: [],
};

// One round trip for the whole board: the visible projects, the active
// project's statuses / sprints / epics and its issues, plus the members its
// cards have to label. Every read narrows to the caller's visible-project set,
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

    const sprintId =
      event.body?.sprintId === undefined ? undefined : event.body.sprintId;

    const issueFilter: Record<string, unknown> = {
      projectId: { eq: activeProjectId },
      ...(sprintId === undefined
        ? {}
        : sprintId === null
          ? { sprintId: { is: 'NULL' } }
          : { sprintId: { eq: sprintId } }),
    };

    const [issueStatuses, sprints, epics, issues] = await Promise.all([
      listScopedRecords({
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
      // SEARCH selection, not the full one: a card renders key, title, type,
      // priority, points, due date, labels, status and owner — never the rich
      // text body, which would multiply the payload per row.
      listScopedRecords<IssueRow>({
        client,
        pluralName: 'issues',
        filter: issueFilter,
        selection: ISSUE_SEARCH_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
    ]);

    const members = await listIssueMembers({ client, issues });

    return {
      projects,
      activeProjectId,
      issueStatuses,
      sprints,
      epics,
      issues,
      members,
      currentWorkspaceMemberId: scope.workspaceMemberId,
    };
  });

export default defineLogicFunction({
  universalIdentifier: TASK_BOARD_LOGIC_FUNCTION_UID,
  name: 'task-board',
  description:
    'Route: one board round trip — visible projects plus the active project statuses, sprints, epics, issues and members.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: TASK_BOARD_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
