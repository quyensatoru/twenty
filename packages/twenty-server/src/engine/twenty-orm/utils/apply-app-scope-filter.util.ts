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
  isAppScopeUnassignedVisible,
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
    .filter(([, permissions]) => permissions.includes(operation))
    .map(([appId]) => appId);

  const allowsUnassignedRows = isAppScopeUnassignedVisible({
    objectMetadata,
    scopePath,
  });

  // Which name this predicate may use depends on WHERE the builder calls us,
  // not just on the query type — Postgres UPDATE/DELETE have no aliased target
  // table, so Twenty rewrites alias to table name (applyTableAliasOnWhereCondition)
  // once, mid-execute:
  // - update: called AFTER that rewrite, so the predicate must already speak
  //   the table name.
  // - soft-delete/delete: called BEFORE it, alongside the RLS and visibility
  //   predicates — the alias is correct here and the rewrite converts it later.
  //   Emitting the table name instead breaks the `before`/`after` event SELECTs,
  //   which inherit these WHERE clauses while still aliased ("missing
  //   FROM-clause entry for table _x").
  // - select: keeps the query alias, which TypeORM defaults to nameSingular.
  const isPostRewriteUpdateQuery =
    queryBuilder.expressionMap.queryType === 'update';
  const mainTableReference = isPostRewriteUpdateQuery
    ? computeObjectTargetTable(objectMetadata)
    : objectMetadata.nameSingular;

  // Nothing granted for this member/operation: every row is out of scope. An
  // unassigned-visible object still keeps its app-less rows reachable, so it
  // falls through to the predicate below instead of being cut off here.
  if (grantedAppIds.length === 0 && !allowsUnassignedRows) {
    queryBuilder.andWhere('1 = 0');

    return;
  }

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
    allowsUnassignedRows,
    hasGrantedAppIds: grantedAppIds.length > 0,
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
  allowsUnassignedRows,
  hasGrantedAppIds,
}: {
  mainTableReference: string;
  hops: AppScopeHop[];
  appJoinColumnName: string;
  workspaceSchemaName: string;
  allowsUnassignedRows: boolean;
  hasGrantedAppIds: boolean;
}): string => {
  if (hops.length === 0) {
    const appColumnReference = `"${mainTableReference}"."${appJoinColumnName}"`;
    const grantedAppIdsClause = `${appColumnReference} IN (:...${APP_SCOPE_GRANTED_APP_IDS_PARAMETER})`;

    if (!allowsUnassignedRows) {
      return grantedAppIdsClause;
    }

    // An empty granted list can't be spread into `IN (:...)` — Postgres would
    // get `IN ()`. With no grants at all, app-less rows are all that's left.
    if (!hasGrantedAppIds) {
      return `${appColumnReference} IS NULL`;
    }

    // `COALESCE(<x> IN (...), TRUE)` rather than the plainer
    // `<x> IN (...) OR <x> IS NULL`: `IN` already yields NULL for an app-less
    // row, so this keeps those rows without naming the column twice. Naming it
    // twice would not survive applyTableAliasOnWhereCondition, which rewrites
    // only the leading `alias.` of a condition — the second reference would
    // still point at the query alias, which UPDATE/DELETE statements don't
    // have ("missing FROM-clause entry").
    return `COALESCE(${grantedAppIdsClause}, TRUE)`;
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
