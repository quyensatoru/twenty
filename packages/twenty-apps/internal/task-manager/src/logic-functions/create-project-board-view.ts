import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CREATE_PROJECT_BOARD_VIEW_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_PROJECT_BOARD_VIEW_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { createProjectBoardView } from './utils/create-project-board-view.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateProjectBoardViewBody = { projectId?: string };

// Manual entry point, for a project that predates the trigger or whose board
// somebody deleted.
const handler = async (event: RoutePayload<CreateProjectBoardViewBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'read',
    });

    return createProjectBoardView({ client, projectId });
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_PROJECT_BOARD_VIEW_LOGIC_FUNCTION_UID,
  name: 'create-project-board-view',
  description:
    "Route: creates a Kanban view filtered to one project, with a column per that project's status.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CREATE_PROJECT_BOARD_VIEW_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
