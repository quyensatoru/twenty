import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import {
  type ORMWorkspaceContext,
  getWorkspaceContext,
} from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import {
  fetchColumnValue,
  resolveEffectiveAppId,
} from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { buildAppScopePathByObjectId } from 'src/engine/twenty-orm/utils/build-app-scope-path-by-object-id.util';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';

export type RelationTargetAppScopeEntry =
  | { fieldName: string; kind: 'merchant'; targetId: string }
  | { fieldName: string; kind: 'workspaceMember'; targetId: string };

// Write-guard validating that a relation TARGET (Issue.assignee/reporter/
// merchant, Epic.assignee, Sprint.owner) belongs to the same App as the
// record being written — resolved via the record's `project`. Distinct from
// assertAppScopeWriteAccessOrThrow, which only checks the ACTOR's own write
// permission into an App, not whether the selected target itself is in scope.
export const assertRelationTargetAppScopeOrThrow = async ({
  authContext,
  globalWorkspaceOrmManager,
  objectNameSingular,
  projectId,
  targets,
}: {
  authContext: WorkspaceAuthContext;
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  objectNameSingular: string;
  projectId: string | null | undefined;
  targets: RelationTargetAppScopeEntry[];
}): Promise<void> => {
  if (targets.length === 0) {
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

    const resolvedAppId = await resolveProjectScopedAppId({
      globalWorkspaceOrmManager,
      context,
      objectNameSingular,
      projectId,
    });

    // No resolvable App (project not attached to any App, or not found) —
    // deny by default, matching assertAppScopeWriteAccessOrThrow's behavior.
    if (!isDefined(resolvedAppId)) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
      );
    }

    const workspaceId = context.authContext.workspace.id;

    for (const target of targets) {
      const isValid =
        target.kind === 'merchant'
          ? (await fetchColumnValue({
              globalWorkspaceOrmManager,
              workspaceId,
              objectNameSingular: 'merchant',
              id: target.targetId,
              columnName: 'appId',
            })) === resolvedAppId
          : await hasAppAccessRow({
              globalWorkspaceOrmManager,
              workspaceId,
              memberId: target.targetId,
              appId: resolvedAppId,
            });

      if (!isValid) {
        throw new PermissionsException(
          PermissionsExceptionMessage.PERMISSION_DENIED,
          PermissionsExceptionCode.PERMISSION_DENIED,
        );
      }
    }
  }, authContext);
};

// Same project -> app resolution as assertAppScopeWriteAccessOrThrow's
// resolveEffectiveAppId, just entered from the record's own `projectId`
// rather than an arbitrary immediate foreign key.
const resolveProjectScopedAppId = async ({
  globalWorkspaceOrmManager,
  context,
  objectNameSingular,
  projectId,
}: {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  context: ORMWorkspaceContext;
  objectNameSingular: string;
  projectId: string | null | undefined;
}): Promise<string | null> => {
  if (!isDefined(projectId)) {
    return null;
  }

  const objectId = context.objectIdByNameSingular[objectNameSingular];
  const objectMetadata = isDefined(objectId)
    ? findFlatEntityByIdInFlatEntityMaps({
        flatEntityId: objectId,
        flatEntityMaps: context.flatObjectMetadataMaps,
      })
    : undefined;

  if (!isDefined(objectMetadata)) {
    return null;
  }

  const scopePath = buildAppScopePathByObjectId({
    flatObjectMetadataMaps: context.flatObjectMetadataMaps,
    flatFieldMetadataMaps: context.flatFieldMetadataMaps,
  })[objectMetadata.id];

  if (!isDefined(scopePath) || scopePath === 'IS_APP_ITSELF') {
    return null;
  }

  return resolveEffectiveAppId({
    globalWorkspaceOrmManager,
    workspaceId: context.authContext.workspace.id,
    objectMetadata,
    scopePath,
    immediateForeignKeyValue: projectId,
    flatObjectMetadataMaps: context.flatObjectMetadataMaps,
    flatFieldMetadataMaps: context.flatFieldMetadataMaps,
  });
};

const hasAppAccessRow = async ({
  globalWorkspaceOrmManager,
  workspaceId,
  memberId,
  appId,
}: {
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  workspaceId: string;
  memberId: string;
  appId: string;
}): Promise<boolean> => {
  const repository = await globalWorkspaceOrmManager.getRepository(
    workspaceId,
    'appAccess',
    { shouldBypassPermissionChecks: true },
  );

  // ponytail: "any AppAccess row exists" is treated as sufficient scope —
  // not distinguishing read/write permission values within `permissions`.
  // Tighten to a specific permission check later if that's ever needed.
  const row = await repository.findOne({ where: { memberId, appId } });

  return isDefined(row);
};
