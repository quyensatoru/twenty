import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { type AppScopeOperation } from 'src/engine/twenty-orm/types/app-scope-permission.type';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// MUST be called inside globalWorkspaceOrmManager.executeInWorkspaceContext —
// getWorkspaceContext() reads the AsyncLocalStorage that wrapper populates and
// throws otherwise. Elevated = leader/PO whose role carries the raw
// all-object-records flag for the operation (or a system/apiKey context).
export const isElevatedActor = ({
  authContext,
  operation,
}: {
  authContext: WorkspaceAuthContext;
  operation: AppScopeOperation;
}): boolean => {
  const context = getWorkspaceContext();

  return shouldBypassAppScope({
    authContext,
    operation,
    allObjectRecordsRoleFlagsByRoleId:
      context.allObjectRecordsRoleFlagsByRoleId,
    userWorkspaceRoleMap: context.userWorkspaceRoleMap,
    apiKeyRoleMap: context.apiKeyRoleMap,
  });
};

// Only the shift's own member may act on it, unless the actor is elevated
// (leader/PO — blanket app-scope access for the operation).
export const assertShiftOwnerOrElevatedOrThrow = async ({
  authContext,
  globalWorkspaceOrmManager,
  shiftId,
  operation,
}: {
  authContext: WorkspaceAuthContext;
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  shiftId: string;
  operation: AppScopeOperation;
}): Promise<void> => {
  const workspace = authContext.workspace;

  assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

  await globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
    const shiftRepository =
      await globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
        workspace.id,
        'shift',
        { shouldBypassPermissionChecks: true },
      );

    const shift = await shiftRepository.findOne({
      where: { id: shiftId },
      select: ['id', 'memberId'],
    });

    const isOwner =
      isDefined(shift) &&
      isDefined(shift.memberId) &&
      isUserAuthContext(authContext) &&
      shift.memberId === authContext.workspaceMemberId;

    if (isOwner) {
      return;
    }

    if (isElevatedActor({ authContext, operation })) {
      return;
    }

    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
    );
  }, authContext);
};
