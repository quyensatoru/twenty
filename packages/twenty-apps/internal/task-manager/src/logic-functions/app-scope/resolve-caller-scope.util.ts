import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { BYPASS_PERMISSION_FLAGS } from '../../constants/bypass-permission-flags';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { type Connection } from '../../types/connection';
import { buildGrantsByAppId } from '../../utils/build-grants-by-app-id.util';

type AppAccessNode = { appId?: string | null; permissions?: string[] | null };

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
    };
  }

  const permissionFlags = currentUser?.currentUserWorkspace?.permissionFlags;
  const canBypassAppScope =
    Array.isArray(permissionFlags) &&
    permissionFlags.some((flag) =>
      BYPASS_PERMISSION_FLAGS.includes(flag as (typeof BYPASS_PERMISSION_FLAGS)[number]),
    );

  const result = await client.query({
    appAccesses: {
      __args: { filter: { memberId: { eq: workspaceMemberId } }, first: 200 },
      edges: { node: { id: true, appId: true, permissions: true } },
    },
  });

  const connection = result?.appAccesses as
    | Connection<AppAccessNode>
    | undefined;

  return {
    workspaceMemberId,
    grantsByAppId: buildGrantsByAppId(
      (connection?.edges ?? []).map((edge) => edge.node),
    ),
    canBypassAppScope,
  };
};
