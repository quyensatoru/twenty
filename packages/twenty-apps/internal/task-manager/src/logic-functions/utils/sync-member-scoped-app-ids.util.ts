import { type ApiClient } from '../../types/api-client';
import { buildGrantsByAppId } from '../../utils/build-grants-by-app-id.util';
import { listGrantedAppIds } from '../../utils/list-granted-app-ids.util';
import { listScopedRecords } from './list-scoped-records.util';

type AppAccessRow = {
  appId?: string | null;
  permissions?: string[] | null;
};

// A member with no grant must match NO row, and an empty list does not say
// that. The engine resolves a member-bound predicate to a relation filter, and
// a relation filter with an empty id list renders to nothing at all
// (turnRecordFilterIntoGqlOperationFilter: `if (recordIds.length === 0)
// return;`), which leaves the role with no filter and the member seeing
// EVERYTHING. Only an absent value fails closed, and an empty array is not
// absent.
//
// So the empty case is written as one id no app can ever have. The filter
// stays well formed, matches nothing, and the hole stays shut.
//
// It has to be a WELL FORMED uuid — version 1-5, variant 8-b — because the
// filter parser validates every id and silently drops the ones it rejects
// (isValidUuid in twenty-shared). The nil uuid fails that test, and a dropped
// id leaves an empty list, which is the very hole this sentinel exists to
// close.
const NO_APP_SENTINEL_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

// Recomputes one member's app-scope mirror from their appAccess rows.
// `scopedAppIds` is what every row-level predicate resolves against, so this
// is the only thing standing between a revoked grant and a member who still
// sees the data.
export const syncMemberScopedAppIds = async ({
  client,
  memberId,
}: {
  client: ApiClient;
  memberId: string;
}): Promise<boolean> => {
  const grantRows = await listScopedRecords<AppAccessRow>({
    client,
    pluralName: 'appAccesses',
    filter: { memberId: { eq: memberId } },
    selection: { id: true, appId: true, permissions: true },
  });

  // Read is what decides visibility; a write-only grant on an app nobody may
  // read is not a reason to show its records.
  const grantedAppIds = listGrantedAppIds(
    buildGrantsByAppId(grantRows),
    'read',
  ).sort();
  const scopedAppIds =
    grantedAppIds.length > 0 ? grantedAppIds : [NO_APP_SENTINEL_ID];

  const memberResult = await client.query({
    workspaceMembers: {
      __args: { filter: { id: { eq: memberId } }, first: 1 },
      edges: { node: { id: true, scopedAppIds: true } },
    },
  });

  const currentScopedAppIds =
    (
      memberResult?.workspaceMembers?.edges?.[0]?.node as
        | { scopedAppIds?: string[] | null }
        | undefined
    )?.scopedAppIds ?? [];

  if (
    currentScopedAppIds.length === scopedAppIds.length &&
    [...currentScopedAppIds]
      .sort()
      .every((appId, index) => appId === scopedAppIds[index])
  ) {
    return false;
  }

  await client.mutation({
    updateWorkspaceMember: {
      __args: { id: memberId, data: { scopedAppIds } },
      id: true,
    },
  });

  return true;
};
