import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { getConnection, kv } from 'twenty-sdk/logic-function';

import { DELETE_REPOSITORY_ROUTE_PATH } from '../constants/route-paths';
import { DELETE_REPOSITORY_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { fetchRecordColumn } from './utils/fetch-record-column.util';
import { deleteGitHubRepoHook } from './utils/github-api.util';
import {
  getGitWebhookRegistrationKey,
  type GitWebhookRegistration,
} from './utils/git-kv.util';
import { deleteGitLabProjectHook } from './utils/gitlab-api.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type DeleteRepositoryBody = { repositoryId?: string };

// Unlinks a git repository: removes the provider webhook first, then the
// registration and the row. The development links stay on their issues —
// history survives the unlink, the way Jira keeps it after a repo is removed.
const handler = async (event: RoutePayload<DeleteRepositoryBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const repositoryId = requireString(
      event.body?.repositoryId,
      'repositoryId',
    );

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'repository',
      recordId: repositoryId,
      operation: 'softDelete',
    });

    const registration = await kv.get<GitWebhookRegistration>(
      getGitWebhookRegistrationKey(repositoryId),
    );

    if (registration !== null) {
      await removeProviderHook({ client, repositoryId, registration });
      await kv.delete(getGitWebhookRegistrationKey(repositoryId));
    }

    await client.mutation({
      deleteRepository: { __args: { id: repositoryId }, id: true },
    });

    return { deletedRepositoryId: repositoryId };
  });

const removeProviderHook = async ({
  client,
  repositoryId,
  registration,
}: {
  client: ApiClient;
  repositoryId: string;
  registration: GitWebhookRegistration;
}): Promise<void> => {
  // Best effort: the caller's token may already be gone, and a hook already
  // gone on the provider must not fail the unlink.
  const connection = await getConnection(registration.connectionId).catch(
    () => null,
  );

  if (connection === null) {
    return;
  }

  try {
    if (registration.provider === 'github') {
      const slug = await fetchRecordColumn(
        client,
        'repositories',
        repositoryId,
        'slug',
      );

      if (slug !== null) {
        await deleteGitHubRepoHook({
          accessToken: connection.accessToken,
          connectionId: registration.connectionId,
          slug,
          baseUrl:
            (await fetchRecordColumn(
              client,
              'repositories',
              repositoryId,
              'baseUrl',
            )) ?? undefined,
          hookId: registration.hookId,
        });
      }
    } else {
      const externalId = await fetchRecordColumn(
        client,
        'repositories',
        repositoryId,
        'externalId',
      );
      const baseUrl = await fetchRecordColumn(
        client,
        'repositories',
        repositoryId,
        'baseUrl',
      );

      if (externalId !== null && baseUrl !== null) {
        await deleteGitLabProjectHook({
          accessToken: connection.accessToken,
          connectionId: registration.connectionId,
          baseUrl,
          projectId: externalId,
          hookId: registration.hookId,
        });
      }
    }
  } catch {
    // Best effort, see above.
  }
};

export default defineLogicFunction({
  universalIdentifier: DELETE_REPOSITORY_LOGIC_FUNCTION_UID,
  name: 'delete-repository',
  description: 'Route: unlinks a git repository from a project.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: DELETE_REPOSITORY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
