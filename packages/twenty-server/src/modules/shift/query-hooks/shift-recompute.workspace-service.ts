import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import {
  computeCheckInLateMinutes,
  computePayableMinutes,
} from 'src/modules/shift/utils/shift-time.util';

type RecomputedAttendance = {
  status: string;
  workingMinutes: number | null;
  checkInLateMinutes: number | null;
};

// Keeps the stored attendance numbers self-consistent with the punches after a
// Leader/PO edits checkInAt/checkOutAt directly on a shift (BR-5.2, BR-9.1).
@Injectable()
export class ShiftRecomputeWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async recomputeAttendance(
    authContext: WorkspaceAuthContext,
    shiftId: string,
  ): Promise<void> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const shiftRepository =
        await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
          workspace.id,
          'shift',
          { shouldBypassPermissionChecks: true },
        );

      const shift = await shiftRepository.findOne({ where: { id: shiftId } });

      // A CANCELLED shift is terminal — its numbers are frozen and must never
      // be re-derived from stray punch edits.
      if (!isDefined(shift) || shift.status === 'CANCELLED') {
        return;
      }

      const recomputed = this.deriveAttendance(shift);

      const isUnchanged =
        recomputed.status === shift.status &&
        recomputed.workingMinutes === shift.workingMinutes &&
        recomputed.checkInLateMinutes === shift.checkInLateMinutes;

      if (isUnchanged) {
        return;
      }

      // repository.update from inside a service does NOT re-enter the GraphQL
      // query hooks, so this write cannot recurse back into the post-hook.
      await shiftRepository.update({ id: shiftId }, recomputed);
    }, authContext);
  }

  // Scheduling rule: the shift's snapshot startTime/endTime (frozen at
  // registration) are the authoritative scheduled window. Payable time is capped
  // at that window's own length; with no scheduled window the full elapsed time
  // is paid (see computePayableMinutes).
  private deriveAttendance(shift: ShiftWorkspaceEntity): RecomputedAttendance {
    const startTime = shift.startTime;
    const endTime = shift.endTime;

    // Only meaningful once there's a punch to check; stays null for the
    // no-punch (UPCOMING) case below without ever calling into the util.
    const checkInLateMinutes =
      isDefined(shift.checkInAt) && isDefined(startTime)
        ? computeCheckInLateMinutes({
            date: shift.date,
            startTime,
            checkInAt: new Date(shift.checkInAt),
          })
        : null;

    if (isDefined(shift.checkInAt) && isDefined(shift.checkOutAt)) {
      return {
        status: 'COMPLETED',
        workingMinutes: computePayableMinutes({
          checkInAt: new Date(shift.checkInAt),
          checkOutAt: new Date(shift.checkOutAt),
          startTime,
          endTime,
        }),
        checkInLateMinutes,
      };
    }

    if (isDefined(shift.checkInAt)) {
      return {
        status: 'IN_PROGRESS',
        workingMinutes: null,
        checkInLateMinutes,
      };
    }

    return {
      status: 'UPCOMING',
      workingMinutes: null,
      checkInLateMinutes: null,
    };
  }
}
