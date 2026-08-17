import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import { isElevatedActor } from 'src/modules/shift/utils/assert-shift-owner-or-elevated-or-throw.util';

// updateMany matches a filter, so per-row ownership can't be cheaply verified.
// A non-elevated member has no legitimate bulk-update path (attendance goes
// through the Task 11 mutations, cancel through its mutation, leader punch-edits
// are single-row updateOne) — block them outright; leader/PO pass through.
@Injectable()
@WorkspaceQueryHook(`shift.updateMany`)
export class ShiftUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs<ShiftWorkspaceEntity>,
  ): Promise<UpdateManyResolverArgs<ShiftWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    // isElevatedActor reads the AsyncLocalStorage workspace context — it must
    // run inside executeInWorkspaceContext.
    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        if (!isElevatedActor({ authContext, operation: 'write' })) {
          throw new PermissionsException(
            PermissionsExceptionMessage.PERMISSION_DENIED,
            PermissionsExceptionCode.PERMISSION_DENIED,
          );
        }

        return payload;
      },
      authContext,
    );
  }
}
