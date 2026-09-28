import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  EPIC_SELECTION,
  ISSUE_SELECTION,
  ISSUE_STATUS_SELECTION,
  PROJECT_SELECTION,
} from '../constants/record-selections';
import { ROADMAP_DATA_ROUTE_PATH } from '../constants/route-paths';
import { ROADMAP_DATA_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type RoadmapDataBody = { projectId?: string };

const handler = async (event: RoutePayload<RoadmapDataBody>) =>
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
        epics: [],
        issues: [],
        issueStatuses: [],
      };
    }

    const [epics, issues, issueStatuses] = await Promise.all([
      listScopedRecords({
        client,
        pluralName: 'epics',
        filter: { projectId: { eq: projectId } },
        selection: EPIC_SELECTION,
        orderBy: [{ position: 'AscNullsLast' }],
      }),
      listScopedRecords({
        client,
        pluralName: 'issues',
        filter: { projectId: { eq: projectId } },
        selection: ISSUE_SELECTION,
        orderBy: [{ dueDate: 'AscNullsLast' }],
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
      epics,
      issues,
      issueStatuses,
    };
  });

export default defineLogicFunction({
  universalIdentifier: ROADMAP_DATA_LOGIC_FUNCTION_UID,
  name: 'roadmap-data',
  description:
    'Route: epics and dated issues of one project for the roadmap timeline.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: ROADMAP_DATA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
