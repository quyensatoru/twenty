import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { getConnection } from 'twenty-sdk/logic-function';

import { LIST_GIT_REPOSITORIES_ROUTE_PATH } from '../constants/route-paths';
import { LIST_GIT_REPOSITORIES_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { isGitProviderName, requireGitBaseUrl } from '../constants/git-hosts';
import { listGitHubRepos } from './utils/github-api.util';
import { listGitLabProjects } from './utils/gitlab-api.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ListGitRepositoriesBody = { connectionId?: string };

// The repos of one connected git account, for the widget's link picker. Rows
// are never typed by hand: the picker offers exactly what the account sees.
// No Twenty rows are read here — the connection itself (resolved with the
// caller's rights, refused when unknown or auth-failed) is the guard.
const handler = async (event: RoutePayload<ListGitRepositoriesBody>) =>
  runScopedRoute(async () => {
    const connectionId = requireString(
      event.body?.connectionId,
      'connectionId',
    );

    const connection = await getConnection(connectionId);

    if (!isGitProviderName(connection.providerName)) {
      throw new Error(`Unsupported git provider "${connection.providerName}".`);
    }

    const repositories =
      connection.providerName === 'github'
        ? await listGitHubRepos({
            accessToken: connection.accessToken,
            connectionId,
          })
        : await listGitLabProjects({
            accessToken: connection.accessToken,
            connectionId,
            baseUrl: requireGitBaseUrl(connection.providerName),
          });

    return {
      provider: connection.providerName,
      handle: connection.handle,
      repositories,
    };
  });

export default defineLogicFunction({
  universalIdentifier: LIST_GIT_REPOSITORIES_LOGIC_FUNCTION_UID,
  name: 'list-git-repositories',
  description: 'Route: lists the git repos of one connected account.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: LIST_GIT_REPOSITORIES_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
