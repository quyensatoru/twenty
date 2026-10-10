import { defineLogicFunction } from 'twenty-sdk/define';
import { getConnection, kv } from 'twenty-sdk/logic-function';

import { GIT_ON_CONNECTION_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { isGitProviderName, requireGitBaseUrl } from '../constants/git-hosts';
import { getGitHubUser } from './utils/github-api.util';
import { getGitLabUser } from './utils/gitlab-api.util';
import { getGitConnectionClaimKey } from './utils/git-kv.util';

export type GitConnectionHookPayload = {
  connectionProviderId?: string;
  connectionProviderName?: string;
  connectedAccountId?: string;
};

// Runs right after a user connects a GitHub/GitLab account: verifies the
// OAuth token works and claims the connection for this workspace, so the
// public webhook resolver can route deliveries back here. Repositories are
// linked afterwards from the Development widget, which is also what registers
// the provider webhooks and enqueues the backfill.
export const gitOnConnectionHandler = async (
  payload: GitConnectionHookPayload,
): Promise<{ success: true; handle: string }> => {
  const connectedAccountId = payload.connectedAccountId;

  if (typeof connectedAccountId !== 'string' || connectedAccountId === '') {
    throw new Error(
      'Git connection registration requires a connectedAccountId.',
    );
  }

  const connection = await getConnection(connectedAccountId);
  const providerName = connection.providerName;

  if (!isGitProviderName(providerName)) {
    throw new Error(`Unsupported git provider "${providerName}".`);
  }

  const handle =
    providerName === 'github'
      ? (
          await getGitHubUser({
            accessToken: connection.accessToken,
            connectionId: connectedAccountId,
          })
        ).login
      : (
          await getGitLabUser({
            accessToken: connection.accessToken,
            connectionId: connectedAccountId,
            baseUrl: requireGitBaseUrl(providerName),
          })
        ).username;

  await kv.set(getGitConnectionClaimKey(connectedAccountId), null, {
    scope: 'SERVER',
  });

  return { success: true, handle };
};

export default defineLogicFunction({
  universalIdentifier: GIT_ON_CONNECTION_LOGIC_FUNCTION_UID,
  name: 'git-on-connection',
  description: 'Hook: verifies a new GitHub/GitLab OAuth connection.',
  timeoutSeconds: 60,
  handler: gitOnConnectionHandler,
});
