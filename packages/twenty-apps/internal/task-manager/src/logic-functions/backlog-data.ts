import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_SELECTION,
  ISSUE_STATUS_SELECTION,
  PROJECT_SELECTION,
  SPRINT_SELECTION,
} from '../constants/record-selections';
import { BACKLOG_DATA_ROUTE_PATH } from '../constants/route-paths';
import { BACKLOG_DATA_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type BacklogDataBody = { projectId?: string };

// The backlog shows every sprint of a project side by side with the unassigned
// issues, so it loads all of the project's issues at once — a sprint-by-sprint
// fetch would make the cross-sprint drag target unknowable until it is opened.
const handler = async (event: RoutePayload<BacklogDataBody>) =>
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
      return {
        projects,
        project: null,
        sprints: [],
        issues: [],
        issueStatuses: [],
        members: [],
      };
    }

    const [sprints, issues, issueStatuses] = await Promise.all([
      listScopedRecords({
        client,
        pluralName: 'sprints',
        filter: { projectId: { eq: projectId } },
        selection: SPRINT_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
      listScopedRecords<{
        assigneeId?: string | null;
        reporterId?: string | null;
      }>({
        client,
        pluralName: 'issues',
        filter: { projectId: { eq: projectId } },
        selection: ISSUE_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
      listScopedRecords({
        client,
        pluralName: 'issueStatuses',
        filter: { projectId: { eq: projectId } },
        selection: ISSUE_STATUS_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
    ]);

    return {
      projects,
      project: projects.find((project) => project.id === projectId) ?? null,
      sprints,
      issues,
      issueStatuses,
      members: await listIssueMembers({ client, issues }),
    };
  });

export default defineLogicFunction({
  universalIdentifier: BACKLOG_DATA_LOGIC_FUNCTION_UID,
  name: 'backlog-data',
  description:
    'Route: sprints and issues of one project for the backlog, narrowed to what the caller may read.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: BACKLOG_DATA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
