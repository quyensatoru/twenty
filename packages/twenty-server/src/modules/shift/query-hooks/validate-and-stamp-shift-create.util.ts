import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { ShiftRateWorkspaceService } from 'src/modules/shift/query-hooks/shift-rate.workspace-service';
import { type ShiftTemplateWorkspaceEntity } from 'src/modules/shift/standard-objects/shift-template.workspace-entity';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import { isElevatedActor } from 'src/modules/shift/utils/assert-shift-owner-or-elevated-or-throw.util';
import {
  getShiftStartUtcMillis,
  getTodayIct,
} from 'src/modules/shift/utils/shift-time.util';

// Shared per-record validation + server stamping for shift creates, used by
// both the createOne and createMany hooks so single- and bulk-create behave
// identically. Runs the registration-integrity gate (no past dates, active
// template only, no duplicate / OT-exclusive conflict), enforces
// ownership/elevation, then stamps the template snapshot + OT multiplier and
// nulls every attendance field. A client-supplied id passes through untouched:
// Twenty's useCreateOneRecord always injects a v4() id so the Apollo cache can
// update optimistically, and the id-overwrite vector is already closed by the
// upsert rejection in the create hooks (without upsert an id match is a plain
// INSERT that collides on the primary key rather than overwriting a row).
//
// MUST be called inside globalWorkspaceOrmManager.executeInWorkspaceContext —
// isElevatedActor and getRepository both read the workspace AsyncLocalStorage.
export const validateAndStampShiftCreate = async ({
  authContext,
  workspaceId,
  data,
  globalWorkspaceOrmManager,
  shiftRateWorkspaceService,
}: {
  authContext: WorkspaceAuthContext;
  workspaceId: string;
  data: ShiftWorkspaceEntity;
  globalWorkspaceOrmManager: GlobalWorkspaceOrmManager;
  shiftRateWorkspaceService: ShiftRateWorkspaceService;
}): Promise<ShiftWorkspaceEntity> => {
  // Members register for themselves; only an elevated actor (leader/PO) may
  // register on behalf of someone else.
  const actorMemberId = isUserAuthContext(authContext)
    ? authContext.workspaceMemberId
    : null;
  const targetMemberId = data.memberId ?? actorMemberId;

  if (!isDefined(targetMemberId)) {
    throw new CommonQueryRunnerException(
      'A shift must belong to a workspace member',
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`A shift must belong to a workspace member.`,
      },
    );
  }

  if (
    targetMemberId !== actorMemberId &&
    !isElevatedActor({ authContext, operation: 'write' })
  ) {
    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
    );
  }

  if (!isDefined(data.date) || data.date < getTodayIct()) {
    throw new CommonQueryRunnerException(
      'Cannot register a shift for a past date',
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`Cannot register a shift for a past date.`,
      },
    );
  }

  if (!isDefined(data.shiftTemplateId)) {
    throw new CommonQueryRunnerException(
      'A shift must reference a shift template',
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`A shift must reference a shift template.`,
      },
    );
  }

  const shiftTemplateRepository =
    await globalWorkspaceOrmManager.getRepository<ShiftTemplateWorkspaceEntity>(
      workspaceId,
      'shiftTemplate',
      { shouldBypassPermissionChecks: true },
    );

  const template = await shiftTemplateRepository.findOne({
    where: { id: data.shiftTemplateId },
  });

  if (!isDefined(template) || !template.isActive) {
    throw new CommonQueryRunnerException(
      'Shift template not found or inactive',
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`Shift template not found or inactive.`,
      },
    );
  }

  // A future date passes the day check above, but a slot whose start time has
  // already passed today is settled — you can't register a shift that has begun.
  if (
    isDefined(template.startTime) &&
    Date.now() >= getShiftStartUtcMillis(data.date, template.startTime)
  ) {
    throw new CommonQueryRunnerException(
      'Cannot register a shift whose start time has already passed',
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`Cannot register a shift whose time has already passed.`,
      },
    );
  }

  const shiftRepository =
    await globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
      workspaceId,
      'shift',
      { shouldBypassPermissionChecks: true },
    );

  const shiftsOnSameSlot = await shiftRepository.find({
    where: { date: data.date, shiftTemplateId: data.shiftTemplateId },
  });
  const activeShifts = shiftsOnSameSlot.filter(
    (shift) => shift.status !== 'CANCELLED',
  );

  if (activeShifts.some((shift) => shift.memberId === targetMemberId)) {
    throw new CommonQueryRunnerException(
      `This member is already registered for ${template.code} on ${data.date}`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`This member is already registered for ${template.code} on ${data.date}.`,
      },
    );
  }

  // TC rule "Không đăng kí trùng ca nhau": HOLIDAY_OT slots are team-wide
  // exclusive — one person per OT slot per day. Regular shifts are only unique
  // per member (checked above).
  if (template.dayKind === 'HOLIDAY_OT' && activeShifts.length > 0) {
    throw new CommonQueryRunnerException(
      `This OT slot is already taken (${template.code} on ${data.date})`,
      CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
      {
        userFriendlyMessage: msg`This OT slot is already taken (${template.code} on ${data.date}).`,
      },
    );
  }

  const rateMultiplier = await shiftRateWorkspaceService.getMultiplierForDate(
    authContext,
    data.date,
  );

  return {
    ...data,
    memberId: targetMemberId,
    name: `${template.code} ${data.date}`,
    templateCode: template.code,
    templateName: template.name,
    startTime: template.startTime,
    endTime: template.endTime,
    status: 'UPCOMING',
    // Attendance fields are never client-writable at creation — check-in/out
    // mutations (Task 11) own the punches.
    checkInAt: null,
    checkOutAt: null,
    checkInLateMinutes: null,
    workingMinutes: null,
    cancelReason: null,
    cancelCategory: null,
    cancelledAt: null,
    rateMultiplier: rateMultiplier > 1 ? rateMultiplier : null,
  };
};
