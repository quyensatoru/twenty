import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { REPOSITORY_SELECTION } from '../constants/record-selections';
import { UPDATE_REPOSITORY_ROUTE_PATH } from '../constants/route-paths';
import { UPDATE_REPOSITORY_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type UpdateRepositoryBody = {
  repositoryId?: string;
  data?: Record<string, unknown>;
};

// Renames a repository link or pauses it. The slug, provider and connection
// are immutable after linking: they name the provider webhook, so changing
// them means unlinking and linking again.
const handler = async (event: RoutePayload<UpdateRepositoryBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const repositoryId = requireString(
      event.body?.repositoryId,
      'repositoryId',
    );
    const input = event.body?.data ?? {};

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'repository',
      recordId: repositoryId,
      operation: 'write',
    });

    const data: Record<string, unknown> = {};

    if (typeof input.name === 'string' && input.name.trim() !== '') {
      data.name = input.name;
    }

    if (typeof input.remoteUrl === 'string') {
      data.remoteUrl = input.remoteUrl.trim() !== '' ? input.remoteUrl : null;
    }

    if (typeof input.isActive === 'boolean') {
      data.isActive = input.isActive;
    }

    const result = await client.mutation({
      updateRepository: {
        __args: { id: repositoryId, data },
        ...REPOSITORY_SELECTION,
      },
    });

    return { repository: result?.updateRepository };
  });

export default defineLogicFunction({
  universalIdentifier: UPDATE_REPOSITORY_LOGIC_FUNCTION_UID,
  name: 'update-repository',
  description: 'Route: renames or pauses a linked git repository.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: UPDATE_REPOSITORY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
