import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import {
  assertShiftOwnerOrElevatedOrThrow,
  isElevatedActor,
} from 'src/modules/shift/utils/assert-shift-owner-or-elevated-or-throw.util';

// Fields a non-elevated member may NEVER set through a direct update — only an
// elevated actor (leader/PO) can. This hook runs on shift.updateOne regardless
// of surface, so it also covers inline edits on the generic /objects/shifts grid.
const PROTECTED_SHIFT_FIELDS = [
  // Attendance / pay: members change these only via the check-in/out and cancel
  // mutations; a leader punch-edit recomputes via the post-hook (Task 10/11).
  'checkInAt',
  'checkOutAt',
  'checkInLateMinutes',
  'workingMinutes',
  'status',
  'rateMultiplier',
  'cancelledAt',
  'cancelReason',
  'cancelCategory',
  'memberId',
  // Scheduling snapshot, frozen at registration. Left open, a member could widen
  // endTime on their OWN shift and let the post-hook recompute inflate
  // workingMinutes (pay), or move date/re-point the template. Only handoverNote
  // stays member-editable.
  'date',
  'startTime',
  'endTime',
  'templateCode',
  'templateName',
  'shiftTemplateId',
] as const;

@Injectable()
@WorkspaceQueryHook(`shift.updateOne`)
export class ShiftUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<ShiftWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<ShiftWorkspaceEntity>> {
    await assertShiftOwnerOrElevatedOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      shiftId: payload.id,
      operation: 'write',
    });

    const touchesProtectedField = PROTECTED_SHIFT_FIELDS.some(
      (field) => field in payload.data,
    );

    if (!touchesProtectedField) {
      return payload;
    }

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
