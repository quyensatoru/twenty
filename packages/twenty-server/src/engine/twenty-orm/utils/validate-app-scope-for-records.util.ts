import { isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import {
  buildAppScopePathByObjectId,
  findAppJoinColumnName,
  isAppScopeUnassignedVisible,
} from 'src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';

// INSERT/UPDATE-side counterpart of apply-app-scope-filter.util.ts: the read
// filter only narrows WHERE, so on its own it lets a member INSERT a row into
// an app they hold no grant for (an INSERT has no WHERE at all), or SET the
// app FK of a row they can reach to an app they cannot.
//
// Scope of this check: objects that hold the app FK on their own row
// (`scopePath === []` — `project`, `merchant`, and any custom object given an
// App relation, e.g. `discount`). Deeper chains (issue -> project -> app) need
// async DB lookups to resolve the effective app and stay with the per-object
// pre-query hooks in assert-app-scope-write-access-or-throw.util.ts.
type ValidateAppScopeForRecordsArgs<T extends ObjectLiteral> = {
  // The values being written, never the merged "record after update": on
  // UPDATE the pre-existing row is fetched with permission checks bypassed,
  // so validating it would reject bulk updates over rows the WHERE clause
  // already excludes.
  values: T[];
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  shouldBypassPermissionChecks: boolean;
  // INSERT writes the whole row, so an absent app FK means the row really will
  // have no app. UPDATE writes only the columns being SET, where an absent app
  // FK just means the app isn't being touched.
  mode: 'insert' | 'update';
};

export const validateAppScopeForRecords = <T extends ObjectLiteral>({
  values,
  objectMetadata,
  internalContext,
  authContext,
  shouldBypassPermissionChecks,
  mode,
}: ValidateAppScopeForRecordsArgs<T>): void => {
  if (shouldBypassPermissionChecks) {
    return;
  }

  if (
    shouldBypassAppScope({
      authContext,
      operation: 'write',
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

  if (!Array.isArray(scopePath) || scopePath.length !== 0) {
    return;
  }

  const appJoinColumnName = findAppJoinColumnName({
    objectMetadata,
    flatObjectMetadataMaps: internalContext.flatObjectMetadataMaps,
    flatFieldMetadataMaps: internalContext.flatFieldMetadataMaps,
  });

  if (!isDefined(appJoinColumnName)) {
    return;
  }

  const allowsUnassignedRows = isAppScopeUnassignedVisible({
    objectMetadata,
    scopePath,
  });

  const memberId = isUserAuthContext(authContext)
    ? authContext.workspaceMemberId
    : undefined;

  const grantsByAppId = isDefined(memberId)
    ? (internalContext.appScopeGrantsByMemberId[memberId] ?? {})
    : {};

  const throwPermissionDenied = () => {
    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
    );
  };

  for (const value of values) {
    const appId = readAppId({ value, appJoinColumnName });

    if (!isDefined(appId)) {
      // Clearing the app on UPDATE is the same move as inserting without one.
      const isClearingApp =
        mode === 'update' && hasAppKey({ value, appJoinColumnName });

      if (mode === 'update' && !isClearingApp) {
        continue;
      }

      if (allowsUnassignedRows) {
        continue;
      }

      // Fail closed rather than write a row its own author cannot read back:
      // the read filter hides app-less rows for every object outside the
      // unassigned-visible list.
      throwPermissionDenied();

      continue;
    }

    if (!grantsByAppId[appId]?.includes('write')) {
      throwPermissionDenied();
    }
  }
};

const hasAppKey = <T extends ObjectLiteral>({
  value,
  appJoinColumnName,
}: {
  value: T;
  appJoinColumnName: string;
}): boolean =>
  appJoinColumnName in value ||
  appJoinColumnName.replace(/Id$/, '') in (value as ObjectLiteral);

// Values reach the query builders as column names (`appId`) once formatData
// has run, but a relation can also still be carried as a nested `{ id }`
// object — read both rather than silently skipping the check on one shape.
const readAppId = <T extends ObjectLiteral>({
  value,
  appJoinColumnName,
}: {
  value: T;
  appJoinColumnName: string;
}): string | undefined => {
  const columnValue = value[appJoinColumnName];

  if (typeof columnValue === 'string') {
    return columnValue;
  }

  const relationValue = value[appJoinColumnName.replace(/Id$/, '')];

  if (
    isDefined(relationValue) &&
    typeof relationValue === 'object' &&
    typeof (relationValue as { id?: unknown }).id === 'string'
  ) {
    return (relationValue as { id: string }).id;
  }

  return undefined;
};
