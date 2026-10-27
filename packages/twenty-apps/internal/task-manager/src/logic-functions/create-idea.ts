import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  CREATE_IDEA_LOGIC_FUNCTION_UID,
  CREATE_IDEA_ROUTE_PATH,
} from '../constants/product-backlog';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { IDEA_SELECTION, pickIdeaInput } from './utils/idea-fields.util';
import { requireString } from './utils/require-string.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateIdeaBody = {
  projectId?: string;
  data?: Record<string, unknown>;
};

const handler = async (event: RoutePayload<CreateIdeaBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const projectId = requireString(event.body?.projectId, 'projectId');
    const input = pickIdeaInput(event.body?.data);

    if (typeof input.title !== 'string' || input.title === '') {
      throw new Error('An idea needs a title.');
    }

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: projectId,
      operation: 'write',
    });

    const result = await client.mutation({
      createIdea: {
        __args: {
          data: { requestCount: 1, ...input, projectId, status: 'INBOX' },
        },
        ...IDEA_SELECTION,
      },
    });

    return { idea: result?.createIdea };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_IDEA_LOGIC_FUNCTION_UID,
  name: 'create-idea',
  description: "Route: records an idea in a project's Ideas list.",
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: CREATE_IDEA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
