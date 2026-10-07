import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { BYPASS_PERMISSION_FLAGS } from '../../constants/bypass-permission-flags';
import { MANAGE_VIEWS_PERMISSION_FLAG } from '../../constants/manage-views-permission-flag';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { type Connection } from '../../types/connection';
import { buildGrantsByAppId } from '../../utils/build-grants-by-app-id.util';

type AppAccessNode = { appId?: string | null; permissions?: string[] | null };

const APP_ACCESS_PAGE_SIZE = 200;

// Reconstructs, per request, what the fork kept in the `appScopeGrants`
// workspace cache: who the caller is, which apps they hold which permissions
// on, and whether they bypass app-scope entirely.
//
// The fork's third bypass rule read the acting role's RAW canXAllObjectRecords
// flags. An app cannot see those — the metadata API exposes permission FLAGS,
// not role record-access flags — so workspace-settings permission flags stand
// in for them (see BYPASS_PERMISSION_FLAGS). Rules one and two (system and
// machine auth contexts) port exactly: a caller with no workspace member
// behind it is an application or API-key token and bypasses.
export const resolveCallerScope = async (
  client: ApiClient,
): Promise<CallerScope> => {
  const { currentUser } = await new MetadataApiClient().query({
    currentUser: {
      id: true,
      workspaceMember: { id: true },
      currentUserWorkspace: { permissionFlags: true },
    },
  });

  const workspaceMemberId = currentUser?.workspaceMember?.id ?? null;

  if (workspaceMemberId === null) {
    return {
      workspaceMemberId: null,
      grantsByAppId: {},
      canBypassAppScope: true,
      canManageViews: true,
    };
  }

  const permissionFlags = currentUser?.currentUserWorkspace?.permissionFlags;
  const callerPermissionFlags: string[] = Array.isArray(permissionFlags)
    ? permissionFlags
    : [];
  const canBypassAppScope = callerPermissionFlags.some((flag) =>
    BYPASS_PERMISSION_FLAGS.includes(
      flag as (typeof BYPASS_PERMISSION_FLAGS)[number],
    ),
  );
  return {
    workspaceMemberId,
    grantsByAppId: buildGrantsByAppId(
      await listMemberAppAccessRows({ client, workspaceMemberId }),
    ),
    canBypassAppScope,
    canManageViews: callerPermissionFlags.includes(
      MANAGE_VIEWS_PERMISSION_FLAG,
    ),
  };
};

// Paged rather than capped: a member whose grants fall off the end of a single
// page would silently lose the apps that were cut, which reads as a revoked
// grant and has no symptom to chase.
const listMemberAppAccessRows = async ({
  client,
  workspaceMemberId,
}: {
  client: ApiClient;
  workspaceMemberId: string;
}): Promise<AppAccessNode[]> => {
  const rows: AppAccessNode[] = [];
  let after: string | undefined;

  for (;;) {
    const result = await client.query({
      appAccesses: {
        __args: {
          filter: { memberId: { eq: workspaceMemberId } },
          first: APP_ACCESS_PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: { cursor: true, node: { id: true, appId: true, permissions: true } },
      },
    });

    const connection = result?.appAccesses as
      | (Connection<AppAccessNode> & {
          edges?: { cursor?: string; node: AppAccessNode }[];
        })
      | undefined;
    const edges = connection?.edges ?? [];

    for (const edge of edges) {
      rows.push(edge.node);
    }

    if (edges.length < APP_ACCESS_PAGE_SIZE) {
      return rows;
    }

    after = edges[edges.length - 1]?.cursor;

    if (after === undefined) {
      return rows;
    }
  }
};
