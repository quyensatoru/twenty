import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  UPDATE_IDEA_LOGIC_FUNCTION_UID,
  UPDATE_IDEA_ROUTE_PATH,
} from '../constants/product-backlog';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import {
  fetchIdea,
  IDEA_SELECTION,
  pickIdeaInput,
} from './utils/idea-fields.util';
import { requireString } from './utils/require-string.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateIdeaBody = {
  ideaId?: string;
  data?: Record<string, unknown>;
};

// Edits, +1s, rejects and restores an idea. Promoting goes through
// promote-idea, which also creates the backlog item.
const handler = async (event: RoutePayload<UpdateIdeaBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const ideaId = requireString(event.body?.ideaId, 'ideaId');
    const idea = await fetchIdea(client, ideaId);

    if (idea === null) {
      throw new Error(`Idea ${ideaId} not found`);
    }

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: idea.projectId,
      operation: 'write',
    });

    const input = pickIdeaInput(event.body?.data);

    if (input.status === 'PROMOTED') {
      delete input.status;
    }

    const result = await client.mutation({
      updateIdea: { __args: { id: ideaId, data: input }, ...IDEA_SELECTION },
    });

    return { idea: result?.updateIdea };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_IDEA_LOGIC_FUNCTION_UID,
  name: 'update-idea',
  description: 'Route: edits, counts, rejects or restores an idea.',
  timeoutSeconds: 30,
  httpRouteTriggerSettings: {
    path: UPDATE_IDEA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
