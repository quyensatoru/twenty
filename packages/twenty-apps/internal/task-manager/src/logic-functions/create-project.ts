import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { PROJECT_SELECTION } from '../constants/record-selections';
import { CREATE_PROJECT_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_PROJECT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { generateUniqueProjectKey } from './utils/generate-unique-project-key.util';
import { runScopedRoute } from './utils/run-scoped-route.util';
import { seedDefaultIssueStatuses } from './utils/seed-default-issue-statuses.util';

type CreateProjectBody = {
  name?: string;
  key?: string;
  appId?: string;
  category?: string;
  leadId?: string;
  description?: unknown;
};

// `project` is the app-scope root: its own `appId` IS the effective app, so
// the write-guard needs no chain walk here.
const handler = async (event: RoutePayload<CreateProjectBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const body = event.body ?? {};

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'project',
      foreignKeyValue: body.appId,
    });

    const key =
      typeof body.key === 'string' && body.key.length > 0
        ? body.key
        : typeof body.name === 'string' && body.name.length > 0
          ? await generateUniqueProjectKey({ client, name: body.name })
          : undefined;

    const result = await client.mutation({
      createProject: {
        __args: {
          data: {
            ...(body.name === undefined ? {} : { name: body.name }),
            ...(key === undefined ? {} : { key }),
            ...(body.appId === undefined ? {} : { appId: body.appId }),
            ...(body.category === undefined ? {} : { category: body.category }),
            ...(body.leadId === undefined ? {} : { leadId: body.leadId }),
            ...(body.description === undefined
              ? {}
              : { description: body.description }),
          },
        },
        ...PROJECT_SELECTION,
      },
    });

    const project = result?.createProject;

    if (project?.id !== undefined) {
      await seedDefaultIssueStatuses({ client, projectId: project.id });
    }

    return { project };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_PROJECT_LOGIC_FUNCTION_UID,
  name: 'create-project',
  description:
    'Route: creates a project, derives its key from the name and seeds the five default issue statuses.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: CREATE_PROJECT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
