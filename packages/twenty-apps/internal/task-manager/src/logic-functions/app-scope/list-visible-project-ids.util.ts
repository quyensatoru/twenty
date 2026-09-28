import { type ApiClient } from '../../types/api-client';
import { type AppScopeOperation } from '../../types/app-scope-operation';
import { type CallerScope } from '../../types/caller-scope';
import { type Connection } from '../../types/connection';
import { listGrantedAppIds } from '../../utils/list-granted-app-ids.util';

const PROJECT_PAGE_SIZE = 200;

// Read-side counterpart of the fork's SQL predicate. The predicate walked
// `issue -> project -> app` inside one statement; an app has no SQL, so the
// chain is collapsed once per request into the set of project ids the caller
// may see, and every downstream read filters on `projectId: { in: [...] }`.
//
// Returns null when the caller bypasses app-scope, meaning "no restriction" —
// callers must treat null as "do not add a project filter", never as "empty".
export const listVisibleProjectIds = async ({
  client,
  scope,
  operation,
}: {
  client: ApiClient;
  scope: CallerScope;
  operation: AppScopeOperation;
}): Promise<string[] | null> => {
  if (scope.canBypassAppScope) {
    return null;
  }

  const grantedAppIds = listGrantedAppIds(scope.grantsByAppId, operation);

  // Nothing granted: every project is out of scope. No object this app owns is
  // visible while unassigned, so this fails closed rather than falling through.
  if (grantedAppIds.length === 0) {
    return [];
  }

  const projectIds: string[] = [];
  let after: string | undefined;

  for (;;) {
    const result = await client.query({
      projects: {
        __args: {
          filter: { appId: { in: grantedAppIds } },
          first: PROJECT_PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: { cursor: true, node: { id: true } },
      },
    });

    const connection = result?.projects as
      | (Connection<{ id: string }> & {
          edges?: { cursor?: string; node: { id: string } }[];
        })
      | undefined;
    const edges = connection?.edges ?? [];

    for (const edge of edges) {
      projectIds.push(edge.node.id);
    }

    if (edges.length < PROJECT_PAGE_SIZE) {
      return projectIds;
    }

    after = edges[edges.length - 1]?.cursor;

    if (after === undefined) {
      return projectIds;
    }
  }
};
