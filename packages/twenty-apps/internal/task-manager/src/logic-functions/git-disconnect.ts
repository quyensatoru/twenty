import { listScopedRecords } from './utils/list-scoped-records.util';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { getConnection, kv } from 'twenty-sdk/logic-function';

import { GIT_ON_DISCONNECT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { deleteGitHubRepoHook } from './utils/github-api.util';
import {
  getGitConnectionClaimKey,
  getGitWebhookRegistrationKey,
  type GitWebhookRegistration,
} from './utils/git-kv.util';
import { deleteGitLabProjectHook } from './utils/gitlab-api.util';
import type { GitConnectionHookPayload } from './git-connection';

// Runs when a GitHub/GitLab account is disconnected: removes every provider
// webhook this app registered with that connection and parks the repository
// rows inactive. The development links stay — history survives the unlink,
// the way Jira keeps it after a repo is removed.
export const gitOnDisconnectHandler = async (
  payload: GitConnectionHookPayload,
) => {
  const connectedAccountId = payload.connectedAccountId;

  if (typeof connectedAccountId !== 'string' || connectedAccountId === '') {
    throw new Error('Git disconnect requires a connectedAccountId.');
  }

  const client = new CoreApiClient({ runAs: 'application' });

  const repositories = await listRepositoriesByConnection({
    client,
    connectedAccountId,
  });

  for (const repository of repositories) {
    const registration = await kv.get<GitWebhookRegistration>(
      getGitWebhookRegistrationKey(repository.id),
    );

    if (registration !== null) {
      await removeProviderHook({
        connectedAccountId,
        repository,
        registration,
      });
      await kv.delete(getGitWebhookRegistrationKey(repository.id));
    }

    await client.mutation({
      updateRepository: {
        __args: { id: repository.id, data: { isActive: false } },
        id: true,
      },
    });
  }

  await kv.delete(getGitConnectionClaimKey(connectedAccountId), {
    scope: 'SERVER',
  });

  return { success: true as const, parkedRepositories: repositories.length };
};

type RepositoryRef = {
  id: string;
  slug?: string | null;
  externalId?: string | null;
  baseUrl?: string | null;
  provider?: string | null;
};

const listRepositoriesByConnection = async ({
  client,
  connectedAccountId,
}: {
  client: ApiClient;
  connectedAccountId: string;
}): Promise<RepositoryRef[]> => {
  return listScopedRecords<RepositoryRef>({
    client,
    pluralName: 'repositories',
    filter: { connectionId: { eq: connectedAccountId } },
    selection: {
      id: true,
      slug: true,
      externalId: true,
      baseUrl: true,
      provider: true,
    },
  });
};

const removeProviderHook = async ({
  connectedAccountId,
  repository,
  registration,
}: {
  connectedAccountId: string;
  repository: RepositoryRef;
  registration: GitWebhookRegistration;
}): Promise<void> => {
  // The token is already revoked on disconnect, so this is best effort: a
  // hook the provider refuses to delete is dead with the grant anyway.
  const connection = await getConnection(connectedAccountId).catch(() => null);

  if (connection === null) {
    return;
  }

  try {
    if (
      registration.provider === 'github' &&
      typeof repository.slug === 'string'
    ) {
      await deleteGitHubRepoHook({
        accessToken: connection.accessToken,
        connectionId: connectedAccountId,
        slug: repository.slug,
        baseUrl: repository.baseUrl ?? undefined,
        hookId: registration.hookId,
      });
    } else if (
      registration.provider === 'gitlab' &&
      typeof repository.externalId === 'string' &&
      typeof repository.baseUrl === 'string'
    ) {
      await deleteGitLabProjectHook({
        accessToken: connection.accessToken,
        connectionId: connectedAccountId,
        baseUrl: repository.baseUrl,
        projectId: repository.externalId,
        hookId: registration.hookId,
      });
    }
  } catch {
    // Best effort, see above.
  }
};

export default defineLogicFunction({
  universalIdentifier: GIT_ON_DISCONNECT_LOGIC_FUNCTION_UID,
  name: 'git-on-disconnect',
  description: 'Hook: removes provider webhooks of a disconnected git account.',
  timeoutSeconds: 120,
  handler: gitOnDisconnectHandler,
});
