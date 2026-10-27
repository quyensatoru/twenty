import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  PROMOTE_IDEA_LOGIC_FUNCTION_UID,
  PROMOTE_IDEA_ROUTE_PATH,
} from '../constants/product-backlog';
import { buildRichTextValue } from '../utils/read-rich-text-plain-value.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { createProductItem } from './utils/create-product-item.util';
import { fetchIdea, IDEA_SELECTION } from './utils/idea-fields.util';
import { requireString } from './utils/require-string.util';
import { assertProductBacklogEditor } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type PromoteIdeaBody = { ideaId?: string };

// The idea becomes a backlog item; who asked and what they said become its
// "why now", so the reason survives the move.
const handler = async (event: RoutePayload<PromoteIdeaBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    assertProductBacklogEditor(scope);

    const ideaId = requireString(event.body?.ideaId, 'ideaId');
    const idea = await fetchIdea(client, ideaId);

    if (idea === null || typeof idea.projectId !== 'string') {
      throw new Error(`Idea ${ideaId} not found`);
    }

    if (idea.status === 'PROMOTED') {
      throw new Error('This idea is already in the backlog.');
    }

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'project',
      recordId: idea.projectId,
      operation: 'write',
    });

    const requester = idea.requester?.trim() ?? '';
    const quote = idea.quote?.trim() ?? '';
    const description = idea.description?.trim() ?? '';
    const item = await createProductItem({
      client,
      scope,
      projectId: idea.projectId,
      data: {
        title: idea.title ?? '',
        whyNow:
          quote === ''
            ? requester
            : requester === ''
              ? quote
              : `${requester}: ${quote}`,
        ...(typeof idea.source === 'string'
          ? { requestSource: idea.source }
          : {}),
        ...(description === ''
          ? {}
          : { description: buildRichTextValue(description) }),
      },
    });

    const result = await client.mutation({
      updateIdea: {
        __args: {
          id: ideaId,
          data: { status: 'PROMOTED', promotedIssueId: item.id },
        },
        ...IDEA_SELECTION,
      },
    });

    return { idea: result?.updateIdea, item };
  });

export default defineLogicFunction({
  universalIdentifier: PROMOTE_IDEA_LOGIC_FUNCTION_UID,
  name: 'promote-idea',
  description: 'Route: turns an idea into a Product Backlog item.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: PROMOTE_IDEA_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
