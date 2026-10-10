import { getActiveGitRepository } from './utils/get-active-git-repository.util';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RESYNC_REPOSITORY_ROUTE_PATH } from '../constants/route-paths';
import { RESYNC_REPOSITORY_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { enqueueGitBackfill } from './utils/enqueue-git-backfill.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ResyncRepositoryBody = { repositoryId?: string };

// Re-runs the backfill for one linked repository on demand: new branches,
// pull/merge requests and commits since the last sync become links. The live
// webhook stays the incremental path where it is registered; this is the
// manual sync for everywhere else (and for localhost, where providers refuse
// unreachable hook destinations).
const handler = async (event: RoutePayload<ResyncRepositoryBody>) =>
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
      operation: 'write',
    });

    if ((await getActiveGitRepository(client, repositoryId)) === null)
      throw new Error('Resume the repository before syncing.');

    await enqueueGitBackfill({ repositoryId });

    return { resyncedRepositoryId: repositoryId };
  });

export default defineLogicFunction({
  universalIdentifier: RESYNC_REPOSITORY_LOGIC_FUNCTION_UID,
  name: 'resync-repository',
  description: 'Route: re-runs the backfill for one linked git repository.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: RESYNC_REPOSITORY_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
