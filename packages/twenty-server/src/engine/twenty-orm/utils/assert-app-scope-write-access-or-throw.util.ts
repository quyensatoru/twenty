import { isDefined } from 'twenty-shared/utils';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import {
  buildAppScopePathByObjectId,
  findAppJoinColumnName,
  resolveAppScopeHops,
} from 'src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';

// Write-guard for CREATE and FK-reassignment on UPDATE — validates that the
// resolved effective app of the record being written is within the acting
// member's `write` app-scope grants. Called from thin pre-query hooks on
// project/issue/sprint/issueComment/worklog createOne/updateOne.
export const assertAppScopeWriteAccessOrThrow = async ({
  authContext,
  globalWorkspaceOrmManager,
  objectNameSingular,
  foreignKeyValue,
}: {
  authContext: WorkspaceAuthContext;
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  objectNameSingular: string;
  foreignKeyValue: string | null | undefined;
}): Promise<void> => {
  if (!isDefined(foreignKeyValue)) {
    return;
  }

  await globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
    const context = getWorkspaceContext();

    if (
      shouldBypassAppScope({
        authContext,
        operation: 'write',
        allObjectRecordsRoleFlagsByRoleId:
          context.allObjectRecordsRoleFlagsByRoleId,
        userWorkspaceRoleMap: context.userWorkspaceRoleMap,
        apiKeyRoleMap: context.apiKeyRoleMap,
      })
    ) {
      return;
    }

    const objectId = context.objectIdByNameSingular[objectNameSingular];
    const objectMetadata = isDefined(objectId)
      ? findFlatEntityByIdInFlatEntityMaps({
          flatEntityId: objectId,
          flatEntityMaps: context.flatObjectMetadataMaps,
        })
      : undefined;

    if (!isDefined(objectMetadata)) {
      return;
    }

    const scopePath = buildAppScopePathByObjectId({
      flatObjectMetadataMaps: context.flatObjectMetadataMaps,
      flatFieldMetadataMaps: context.flatFieldMetadataMaps,
    })[objectMetadata.id];

    // Not a scoped object — nothing to guard. `app` itself is also never
    // guarded here: this hook only ever runs for project/issue/sprint/
    // issueComment/worklog createOne/updateOne, never for `app`, which has no
    // FK to reassign in the first place.
    if (!isDefined(scopePath) || scopePath === 'IS_APP_ITSELF') {
      return;
    }

    const effectiveAppId = await resolveEffectiveAppId({
      globalWorkspaceOrmManager,
      workspaceId: context.authContext.workspace.id,
      objectMetadata,
      scopePath,
      immediateForeignKeyValue: foreignKeyValue,
      flatObjectMetadataMaps: context.flatObjectMetadataMaps,
      flatFieldMetadataMaps: context.flatFieldMetadataMaps,
    });

    const memberId = isUserAuthContext(authContext)
      ? authContext.workspaceMemberId
      : undefined;

    const grantedPermissions =
      isDefined(memberId) && isDefined(effectiveAppId)
        ? context.appScopeGrantsByMemberId[memberId]?.[effectiveAppId]
        : undefined;

    if (!grantedPermissions?.has('write')) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
      );
    }
  }, authContext);
};

// Resolves the effective `app` id for a record being written, given the
// object's scope path and the value of its immediate foreign key.
// - scopePath.length === 0 (the object itself is the app-scope root, e.g.
//   `project`): the foreign key value passed in already IS the appId.
// - scopePath.length > 0: walk the remaining chain via bypass-permission
//   repository lookups down to the app-scope root's own row, then read its
//   app join column.
const resolveEffectiveAppId = async ({
  globalWorkspaceOrmManager,
  workspaceId,
  objectMetadata,
  scopePath,
  immediateForeignKeyValue,
  flatObjectMetadataMaps,
  flatFieldMetadataMaps,
}: {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  workspaceId: string;
  objectMetadata: FlatObjectMetadata;
  scopePath: string[];
  immediateForeignKeyValue: string;
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
}): Promise<string | null> => {
  if (scopePath.length === 0) {
    return immediateForeignKeyValue;
  }

  const hops = resolveAppScopeHops({
    objectMetadata,
    scopePath,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  });

  if (hops.length !== scopePath.length) {
    return null;
  }

  let currentTargetObjectMetadata: FlatObjectMetadata =
    hops[0].targetObjectMetadata;
  let currentId: string | null = immediateForeignKeyValue;

  for (let i = 1; i < hops.length; i++) {
    if (!isDefined(currentId)) {
      return null;
    }

    currentId = await fetchColumnValue({
      globalWorkspaceOrmManager,
      workspaceId,
      objectNameSingular: currentTargetObjectMetadata.nameSingular,
      id: currentId,
      columnName: hops[i].joinColumnName,
    });

    currentTargetObjectMetadata = hops[i].targetObjectMetadata;
  }

  if (!isDefined(currentId)) {
    return null;
  }

  const appJoinColumnName = findAppJoinColumnName({
    objectMetadata: currentTargetObjectMetadata,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  });

  if (!isDefined(appJoinColumnName)) {
    return null;
  }

  return fetchColumnValue({
    globalWorkspaceOrmManager,
    workspaceId,
    objectNameSingular: currentTargetObjectMetadata.nameSingular,
    id: currentId,
    columnName: appJoinColumnName,
  });
};

const fetchColumnValue = async ({
  globalWorkspaceOrmManager,
  workspaceId,
  objectNameSingular,
  id,
  columnName,
}: {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  workspaceId: string;
  objectNameSingular: string;
  id: string;
  columnName: string;
}): Promise<string | null> => {
  const repository = await globalWorkspaceOrmManager.getRepository(
    workspaceId,
    objectNameSingular,
    { shouldBypassPermissionChecks: true },
  );

  const row = await repository
    .createQueryBuilder()
    .select(`"${columnName}"`, 'value')
    .where('id = :id', { id })
    .getRawOne<{ value: string | null }>();

  return row?.value ?? null;
};
