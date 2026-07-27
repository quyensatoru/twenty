import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';
import { type QueryExpressionMap } from 'typeorm/query-builder/QueryExpressionMap';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type AppScopeOperation } from 'src/engine/twenty-orm/types/app-scope-permission.type';
import {
  buildAppScopePathByObjectId,
  findAppJoinColumnName,
  resolveAppScopeHops,
  type AppScopeHop,
} from 'src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { computeObjectTargetTable } from 'src/engine/utils/compute-object-target-table.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const APP_SCOPE_GRANTED_APP_IDS_PARAMETER = 'appScopeGrantedAppIds';

// A minimal structural surface over TypeORM's Select/Update/Delete/SoftDelete
// query builders — this predicate is a plain parameterized WHERE clause
// (`.andWhere(sql, params)`), so unlike the Enterprise row-level-security reuse
// trick, it doesn't need joins, Brackets, or field-permission checks, and
// doesn't need to be cast to WorkspaceSelectQueryBuilder.
type AppScopeFilterableQueryBuilder = {
  andWhere: (condition: string, parameters?: ObjectLiteral) => unknown;
  expressionMap: QueryExpressionMap;
};

type ApplyAppScopeFilterArgs = {
  queryBuilder: AppScopeFilterableQueryBuilder;
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  shouldBypassPermissionChecks: boolean;
  operation: AppScopeOperation;
};

export const applyAppScopeFilter = ({
  queryBuilder,
  objectMetadata,
  internalContext,
  authContext,
  shouldBypassPermissionChecks,
  operation,
}: ApplyAppScopeFilterArgs): void => {
  if (shouldBypassPermissionChecks) {
    return;
  }

  if (
    shouldBypassAppScope({
      authContext,
      operation,
      allObjectRecordsRoleFlagsByRoleId:
        internalContext.allObjectRecordsRoleFlagsByRoleId,
      userWorkspaceRoleMap: internalContext.userWorkspaceRoleMap,
      apiKeyRoleMap: internalContext.apiKeyRoleMap,
    })
  ) {
    return;
  }

  const scopePath = buildAppScopePathByObjectId({
    flatObjectMetadataMaps: internalContext.flatObjectMetadataMaps,
    flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
  })[objectMetadata.id];

  // Not a scoped object (no chain up to the app-scope root) — no-op.
  if (!isDefined(scopePath)) {
    return;
  }

  const memberId = isUserAuthContext(authContext)
    ? authContext.workspaceMemberId
    : undefined;

  const grantsByAppId = isDefined(memberId)
    ? (internalContext.appScopeGrantsByMemberId[memberId] ?? {})
    : {};

  const grantedAppIds = Object.entries(grantsByAppId)
    .filter(([, permissions]) => permissions.has(operation))
    .map(([appId]) => appId);

  // Nothing granted for this member/operation: every row is out of scope.
  if (grantedAppIds.length === 0) {
    queryBuilder.andWhere('1 = 0');

    return;
  }

  // Update/soft-delete/delete builders reference the direct table name in their
  // WHERE clause (Twenty already rewrites other conditions from alias to table
  // name before executing them, since Postgres UPDATE/DELETE don't support an
  // aliased target table the way a SELECT does) — referencing the alias here
  // instead would produce a "missing FROM-clause entry" error. SELECT keeps the
  // query alias, which TypeORM defaults to the object's nameSingular.
  const isUpdateOrDeleteQuery = ['update', 'soft-delete', 'delete'].includes(
    queryBuilder.expressionMap.queryType,
  );
  const mainTableReference = isUpdateOrDeleteQuery
    ? computeObjectTargetTable(objectMetadata)
    : objectMetadata.nameSingular;

  // `app` itself: scope by comparing its own `id` directly — there's no join
  // column to walk since `app` has no FK to itself.
  if (scopePath === 'IS_APP_ITSELF') {
    queryBuilder.andWhere(
      `"${mainTableReference}"."id" IN (:...${APP_SCOPE_GRANTED_APP_IDS_PARAMETER})`,
      { [APP_SCOPE_GRANTED_APP_IDS_PARAMETER]: grantedAppIds },
    );

    return;
  }

  const hops = resolveAppScopeHops({
    objectMetadata,
    scopePath,
    flatObjectMetadataMaps: internalContext.flatObjectMetadataMaps,
    flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
  });

  if (hops.length !== scopePath.length) {
    // Metadata inconsistency (a hop's field disappeared) — fail closed rather
    // than silently exposing unscoped data.
    queryBuilder.andWhere('1 = 0');

    return;
  }

  const appHolderObjectMetadata =
    hops.length === 0
      ? objectMetadata
      : hops[hops.length - 1].targetObjectMetadata;

  const appJoinColumnName = findAppJoinColumnName({
    objectMetadata: appHolderObjectMetadata,
    flatObjectMetadataMaps: internalContext.flatObjectMetadataMaps,
    flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
  });

  if (!isDefined(appJoinColumnName)) {
    queryBuilder.andWhere('1 = 0');

    return;
  }

  // The main-table reference (alias or bare name) always resolves without a
  // schema prefix — TypeORM's own FROM/UPDATE/DELETE clause already schema-
  // qualifies it. Every OTHER table this predicate touches (the subquery hops)
  // is a fresh, non-aliased reference that Postgres resolves via search_path —
  // which does not include the workspace schema — so those must be qualified
  // explicitly with the workspace's schema name.
  const workspaceSchemaName = getWorkspaceSchemaName(
    internalContext.workspaceId,
  );

  const predicateSql = buildAppScopePredicateSql({
    mainTableReference,
    hops,
    appJoinColumnName,
    workspaceSchemaName,
  });

  queryBuilder.andWhere(predicateSql, {
    [APP_SCOPE_GRANTED_APP_IDS_PARAMETER]: grantedAppIds,
  });
};

const buildAppScopePredicateSql = ({
  mainTableReference,
  hops,
  appJoinColumnName,
  workspaceSchemaName,
}: {
  mainTableReference: string;
  hops: AppScopeHop[];
  appJoinColumnName: string;
  workspaceSchemaName: string;
}): string => {
  if (hops.length === 0) {
    return `"${mainTableReference}"."${appJoinColumnName}" IN (:...${APP_SCOPE_GRANTED_APP_IDS_PARAMETER})`;
  }

  const appHolderTable = computeObjectTargetTable(
    hops[hops.length - 1].targetObjectMetadata,
  );

  let innerSql = `SELECT "id" FROM "${workspaceSchemaName}"."${appHolderTable}" WHERE "${appJoinColumnName}" IN (:...${APP_SCOPE_GRANTED_APP_IDS_PARAMETER})`;

  for (let i = hops.length - 1; i >= 1; i--) {
    const table = computeObjectTargetTable(hops[i - 1].targetObjectMetadata);

    innerSql = `SELECT "id" FROM "${workspaceSchemaName}"."${table}" WHERE "${hops[i].joinColumnName}" IN (${innerSql})`;
  }

  return `"${mainTableReference}"."${hops[0].joinColumnName}" IN (${innerSql})`;
};
