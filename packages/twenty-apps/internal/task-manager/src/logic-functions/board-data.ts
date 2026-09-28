import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_SELECTION,
  ISSUE_STATUS_SELECTION,
  PROJECT_SELECTION,
  SPRINT_SELECTION,
} from '../constants/record-selections';
import { BOARD_DATA_ROUTE_PATH } from '../constants/route-paths';
import { BOARD_DATA_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type BoardDataBody = {
  projectId?: string;
  sprintId?: string | null;
};

// Everything the Kanban board needs in one round trip: the projects the caller
// can see, and — for the selected project — its statuses, its active sprints
// and the issues in the chosen sprint.
const handler = async (event: RoutePayload<BoardDataBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const visibleProjectIds = await listVisibleProjectIds({
      client,
      scope,
      operation: 'read',
    });

    const projects = await listScopedRecords<{ id: string }>({
      client,
      pluralName: 'projects',
      filter: buildProjectScopeFilter(visibleProjectIds, 'id'),
      selection: PROJECT_SELECTION,
    });

    const requestedProjectId = event.body?.projectId;
    const projectId =
      typeof requestedProjectId === 'string' &&
      projects.some((project) => project.id === requestedProjectId)
        ? requestedProjectId
        : projects[0]?.id;

    if (projectId === undefined) {
      return { projects, project: null, issueStatuses: [], sprints: [], issues: [] };
    }

    const issueStatuses = await listScopedRecords({
      client,
      pluralName: 'issueStatuses',
      filter: { projectId: { eq: projectId } },
      selection: ISSUE_STATUS_SELECTION,
      orderBy: [{ position: 'AscNullsLast' }],
    });

    const sprints = await listScopedRecords<{ id: string; state?: string }>({
      client,
      pluralName: 'sprints',
      filter: { projectId: { eq: projectId } },
      selection: SPRINT_SELECTION,
      orderBy: [{ position: 'AscNullsLast' }],
    });

    const requestedSprintId = event.body?.sprintId;
    const sprintId =
      requestedSprintId === null
        ? null
        : typeof requestedSprintId === 'string'
          ? requestedSprintId
          : (sprints.find((sprint) => sprint.state === 'ACTIVE')?.id ?? null);

    const issues = await listScopedRecords({
      client,
      pluralName: 'issues',
      filter: {
        projectId: { eq: projectId },
        ...(sprintId === null ? {} : { sprintId: { eq: sprintId } }),
      },
      selection: ISSUE_SELECTION,
      orderBy: [{ position: 'AscNullsLast' }],
    });

    return {
      projects,
      project: projects.find((project) => project.id === projectId) ?? null,
      issueStatuses,
      sprints,
      sprintId,
      issues,
    };
  });

export default defineLogicFunction({
  universalIdentifier: BOARD_DATA_LOGIC_FUNCTION_UID,
  name: 'board-data',
  description:
    'Route: everything the Kanban board renders, narrowed to the projects the caller may read.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: BOARD_DATA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
