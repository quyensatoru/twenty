import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { DEV_TASK_PROJECTS_ROUTE_PATH } from '../constants/route-paths';
import { DEV_TASK_PROJECTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type DeveloperProject } from '../types/dashboard';
import { listAllRecords } from './utils/list-all-records.util';
import { runBcRoute } from './utils/run-bc-route.util';

type ProjectNode = {
  id: string;
  name: string | null;
  key: string | null;
  app: { name: string | null } | null;
};

type StatusNode = {
  id: string;
  projectId: string | null;
  category: string | null;
  position: number | null;
};

// Task Manager projects a developer task can be filed in, the client's app
// first. Task Manager's own create-issue route still checks the caller's
// App access when the task is created.
const handler = async (event: RoutePayload<{ appName?: string | null }>) =>
  runBcRoute(async ({ client, scope }) => {
    if (scope.role === 'NONE') {
      throw new Error('Not authorized: you are not in a BC team.');
    }

    const appName = (event.body?.appName ?? '').toUpperCase();
    const projects = await listAllRecords<ProjectNode>({
      client,
      pluralName: 'projects',
      selection: { id: true, name: true, key: true, app: { name: true } },
      orderBy: [{ name: 'AscNullsLast' }],
    });
    const statuses =
      projects.length === 0
        ? []
        : await listAllRecords<StatusNode>({
            client,
            pluralName: 'issueStatuses',
            filter: { projectId: { in: projects.map((project) => project.id) } },
            selection: { id: true, projectId: true, category: true, position: true },
            orderBy: [{ position: 'AscNullsLast' }],
          });

    const result: DeveloperProject[] = projects
      .map((project) => {
        const projectStatuses = statuses.filter((status) => status.projectId === project.id);

        return {
          id: project.id,
          name: project.name ?? project.key ?? '',
          key: project.key,
          appName: project.app?.name ?? null,
          defaultStatusId:
            (
              projectStatuses.find((status) => status.category === 'UNSTARTED') ??
              projectStatuses[0]
            )?.id ?? null,
        };
      })
      .sort(
        (left, right) =>
          Number((right.appName ?? '').toUpperCase() === appName) -
            Number((left.appName ?? '').toUpperCase() === appName) ||
          left.name.localeCompare(right.name),
      );

    return { projects: result };
  });

export default defineLogicFunction({
  universalIdentifier: DEV_TASK_PROJECTS_LOGIC_FUNCTION_UID,
  name: 'bc-dev-task-projects',
  description:
    "Route: Task Manager projects a developer task can be filed in, the client's app first.",
  timeoutSeconds: 20,
  httpRouteTriggerSettings: {
    path: DEV_TASK_PROJECTS_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
