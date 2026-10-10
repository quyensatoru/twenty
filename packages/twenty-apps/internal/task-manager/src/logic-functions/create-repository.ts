import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { getConnection, kv } from 'twenty-sdk/logic-function';

import { REPOSITORY_SELECTION } from '../constants/record-selections';
import { CREATE_REPOSITORY_ROUTE_PATH } from '../constants/route-paths';
import { CREATE_REPOSITORY_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import {
  gitDisplayProvider,
  isGitProviderName,
  readGitInstanceBaseUrl,
  requireGitBaseUrl,
} from '../constants/git-hosts';
import { assertAppScopeWriteAccess } from './app-scope/assert-app-scope-write-access.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { enqueueGitBackfill } from './utils/enqueue-git-backfill.util';
import { getGitWebhookDestinationUrl } from './utils/get-git-webhook-destination-url.util';
import { createGitHubRepoHook, getGitHubRepo } from './utils/github-api.util';
import { getGitWebhookRegistrationKey } from './utils/git-kv.util';
import {
  createGitLabProjectHook,
  getGitLabProject,
} from './utils/gitlab-api.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type CreateRepositoryBody = {
  projectId?: string;
  connectionId?: string;
  slug?: string;
};

// Links a repo off a connected git account to a project: verifies the repo
// through the OAuth token, stores the row, registers the provider webhook
// pointing at this app, and enqueues the backfill. The slug comes from the
// widget's picker — a repo the account cannot see fails verification here.
const handler = async (event: RoutePayload<CreateRepositoryBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const projectId = requireString(event.body?.projectId, 'projectId');
    const connectionId = requireString(
      event.body?.connectionId,
      'connectionId',
    );
    const slug = requireString(event.body?.slug, 'slug').trim().toLowerCase();

    await assertAppScopeWriteAccess({
      client,
      scope,
      objectNameSingular: 'repository',
      foreignKeyValue: projectId,
    });

    const connection = await getConnection(connectionId);

    if (!isGitProviderName(connection.providerName)) {
      throw new Error(`Unsupported git provider "${connection.providerName}".`);
    }

    const provider = connection.providerName;
    // gitlab.com resolves to its public default; a self-hosted instance
    // resolves from GITLAB_BASE_URL and refuses when unconfigured.
    const baseUrl =
      provider === 'github'
        ? (readGitInstanceBaseUrl('github') ?? 'https://github.com')
        : requireGitBaseUrl(provider);

    const duplicates = await listScopedRecords<{ id: string }>({
      client,
      pluralName: 'repositories',
      filter: { projectId: { eq: projectId }, slug: { eq: slug } },
      selection: { id: true },
      maxRecords: 1,
    });

    if (duplicates.length > 0) {
      throw new Error('This project already links that repository.');
    }

    // Verification doubles as the read of the provider's repo id, which the
    // hook and backfill calls need.
    const repo =
      provider === 'github'
        ? await getGitHubRepo({
            accessToken: connection.accessToken,
            connectionId,
            slug,
            baseUrl,
          })
        : await getGitLabProject({
            accessToken: connection.accessToken,
            connectionId,
            baseUrl,
            slug,
          });

    const data: Record<string, unknown> = {
      name: repo.name,
      provider: gitDisplayProvider(provider),
      slug: repo.slug,
      remoteUrl: repo.url,
      isActive: true,
      connectionId,
      externalId: repo.externalId,
      baseUrl,
      projectId,
      appId: await resolveEffectiveAppId({
        client,
        objectNameSingular: 'repository',
        immediateForeignKeyValue: projectId,
      }),
    };

    const apiUrl = process.env.TWENTY_API_URL;

    if (typeof apiUrl !== 'string' || apiUrl === '') {
      throw new Error(
        'TWENTY_API_URL is required to register the git webhook.',
      );
    }

    const created = await client.mutation({
      createRepository: { __args: { data }, ...REPOSITORY_SELECTION },
    });

    const repository = created?.createRepository as { id: string } | undefined;

    if (repository === undefined) {
      throw new Error('The repository link was not created.');
    }

    const hookSecret = crypto.randomUUID();
    const destinationUrl = getGitWebhookDestinationUrl({
      apiUrl,
      connectedAccountId: connectionId,
      repositoryId: repository.id,
    });

    // Webhook registration is best effort: a provider that refuses the hook
    // (a localhost destination on a default GitLab, a missing Maintainer
    // grant, …) must not lose the link. The row stays, the backfill below
    // still fills the panel, and the widget offers a manual resync.
    let webhookError: string | null = null;

    try {
      const hook =
        provider === 'github'
          ? await createGitHubRepoHook({
              accessToken: connection.accessToken,
              connectionId,
              slug: repo.slug,
              baseUrl,
              destinationUrl,
              secret: hookSecret,
            })
          : await createGitLabProjectHook({
              accessToken: connection.accessToken,
              connectionId,
              baseUrl,
              projectId: repo.externalId,
              destinationUrl,
              secret: hookSecret,
            });

      await kv.set(getGitWebhookRegistrationKey(repository.id), {
        provider: provider === 'github' ? 'github' : 'gitlab',
        connectionId,
        hookId: String(hook.id),
        secret: hookSecret,
        isActive: true,
      });
    } catch (error) {
      webhookError =
        error instanceof Error
          ? error.message
          : 'Git webhook registration failed.';
    }

    await enqueueGitBackfill({ repositoryId: repository.id });

    return {
      repository: created?.createRepository,
      webhookRegistered: webhookError === null,
      ...(webhookError === null ? {} : { webhookError }),
    };
  });

export default defineLogicFunction({
  universalIdentifier: CREATE_REPOSITORY_LOGIC_FUNCTION_UID,
  name: 'create-repository',
  description: 'Route: links a repo off a connected git account to a project.',
  timeoutSeconds: 120,
  httpRouteTriggerSettings: {
    path: CREATE_REPOSITORY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
