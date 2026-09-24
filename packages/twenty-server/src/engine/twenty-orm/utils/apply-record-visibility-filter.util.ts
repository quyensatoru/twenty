import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { substituteCurrentMemberPlaceholder } from 'src/engine/metadata-modules/record-visibility-policy/utils/substitute-current-member-placeholder.util';
import { renderRowLevelPermissionFilterToSql } from 'src/engine/twenty-orm/utils/render-row-level-permission-filter-to-sql.util';
import { resolveRoleIdsFromAuthContext } from 'src/engine/twenty-orm/utils/resolve-role-ids-from-auth-context.util';

// A minimal structural surface over v2's WorkspaceSelectQueryBuilder — this
// predicate is a plain parameterized WHERE clause (`.andWhere(sql, params)`),
// so it only needs the query's own alias and the ability to append a WHERE.
type RecordVisibilityFilterableQueryBuilder = {
  alias: string;
  andWhere: (
    condition: string,
    parameters?: Record<string, unknown>,
  ) => unknown;
};

// OSS equivalent of Enterprise's row-level-permission-predicate application —
// reuses the same filter-to-SQL renderer RLS uses, since a Record Visibility
// Policy is the same shape (a role-scoped record filter), just attached to a
// different metadata entity. Multiple roles AND together, mirroring RLS: each
// role's restriction still applies, so merging them first would let one role's
// restriction vanish and widen access.
type ApplyRecordVisibilityFilterArgs = {
  queryBuilder: RecordVisibilityFilterableQueryBuilder;
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
};

export const applyRecordVisibilityFilter = ({
  queryBuilder,
  objectMetadata,
  internalContext,
  authContext,
}: ApplyRecordVisibilityFilterArgs): void => {
  const roleIds = resolveRoleIdsFromAuthContext({
    authContext,
    userWorkspaceRoleMap: internalContext.userWorkspaceRoleMap,
    apiKeyRoleMap: internalContext.apiKeyRoleMap,
  });

  if (roleIds.length === 0) {
    return;
  }

  const memberId = isUserAuthContext(authContext)
    ? authContext.workspaceMemberId
    : undefined;

  const recordFilters: Record<string, unknown>[] = [];

  for (const roleId of roleIds) {
    const policy =
      internalContext.recordVisibilityPoliciesByRoleId[roleId]?.[
        objectMetadata.id
      ];

    if (!isDefined(policy)) {
      continue;
    }

    const recordFilter = substituteCurrentMemberPlaceholder({
      filter: policy.filter,
      currentMemberFieldName: policy.currentMemberFieldName,
      memberId,
    });

    if (recordFilter === 'CANNOT_EVALUATE') {
      // The policy needs "current member" but this request has no member
      // (e.g. an API key) — fail closed rather than silently skip the filter.
      queryBuilder.andWhere('1 = 0');

      return;
    }

    if (recordFilter && Object.keys(recordFilter).length > 0) {
      recordFilters.push(recordFilter);
    }
  }

  if (recordFilters.length === 0) {
    return;
  }

  const combinedFilter =
    recordFilters.length === 1 ? recordFilters[0] : { and: recordFilters };

  const rendered = renderRowLevelPermissionFilterToSql({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recordFilter: combinedFilter as any,
    tableAlias: queryBuilder.alias,
    objectMetadata,
    flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
  });

  if (!isDefined(rendered)) {
    return;
  }

  queryBuilder.andWhere(rendered.sql, rendered.parameters);
};
