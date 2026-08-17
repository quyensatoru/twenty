import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type ShiftTemplateWorkspaceEntity } from 'src/modules/shift/standard-objects/shift-template.workspace-entity';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';
import { assertShiftOwnerOrElevatedOrThrow } from 'src/modules/shift/utils/assert-shift-owner-or-elevated-or-throw.util';
import {
  computeCheckInLateMinutes,
  computePayableMinutes,
  getIctMinutesOfDay,
  getShiftEndUtcMillis,
  getTodayIct,
  parseHHmm,
} from 'src/modules/shift/utils/shift-time.util';

const CANCEL_CATEGORIES = ['SICK', 'PERSONAL', 'SWAP', 'OTHER'] as const;

// Atomic attendance actions (BR-9.x). These replace the `!shift checkin/checkout`
// bot commands and are the ONLY member-facing path that mutates attendance
// fields. No notification code lives here — Mattermost messages are fired by the
// Task-16 workflows on record-updated; this service only writes data.
@Injectable()
export class ShiftAttendanceWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async checkIn(
    authContext: WorkspaceAuthContext,
    shiftId: string,
  ): Promise<boolean> {
    // Ownership/elevation gate opens its own workspace context and fully
    // returns before we open ours below — sequential, never truly nested.
    await assertShiftOwnerOrElevatedOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      shiftId,
      operation: 'write',
    });

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const shiftRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
            workspace.id,
            'shift',
            { shouldBypassPermissionChecks: true },
          );

        const shift = await shiftRepository.findOne({ where: { id: shiftId } });

        if (!isDefined(shift)) {
          throw new UserInputError('Shift not found');
        }

        if (shift.status !== 'UPCOMING') {
          throw new UserInputError('Shift is not open for check-in');
        }

        if (isDefined(shift.checkInAt)) {
          throw new UserInputError('Already checked in');
        }

        const template = await this.loadTemplate(
          workspace.id,
          shift.shiftTemplateId,
        );
        const earlyCheckInMinutes = template?.earlyCheckInMinutes ?? null;

        // Early-window guard is a no-op unless the padding is configured (null =
        // off) and the shift is today with a scheduled start.
        if (
          earlyCheckInMinutes !== null &&
          isDefined(shift.startTime) &&
          shift.date === getTodayIct()
        ) {
          const opensAt = parseHHmm(shift.startTime) - earlyCheckInMinutes;

          if (getIctMinutesOfDay(new Date()) < opensAt) {
            throw new UserInputError(
              `Too early to check in — opens ${Math.floor(opensAt / 60)}:${String(
                opensAt % 60,
              ).padStart(2, '0')} ICT`,
            );
          }
        }

        // Upper-bound guard (independent of the early padding): once the
        // scheduled window has fully elapsed the shift is missed, not checkable.
        // Without this a shift whose time has long passed still accepted a
        // check-in and flipped to IN_PROGRESS.
        if (
          isDefined(shift.startTime) &&
          isDefined(shift.endTime) &&
          Date.now() >
            getShiftEndUtcMillis(shift.date, shift.startTime, shift.endTime)
        ) {
          throw new UserInputError(
            'Too late to check in — the shift window has ended',
          );
        }

        const now = new Date();
        // BR-9.1: NO grace — punching >=1 minute past start is late.
        const checkInLateMinutes = isDefined(shift.startTime)
          ? computeCheckInLateMinutes({
              date: shift.date,
              startTime: shift.startTime,
              checkInAt: now,
            })
          : null;

        await shiftRepository.update(
          { id: shiftId },
          {
            checkInAt: now.toISOString(),
            status: 'IN_PROGRESS',
            checkInLateMinutes,
          },
        );

        return true;
      },
      authContext,
    );
  }

  async checkOut(
    authContext: WorkspaceAuthContext,
    shiftId: string,
    handoverNote: string | null,
  ): Promise<boolean> {
    await assertShiftOwnerOrElevatedOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      shiftId,
      operation: 'write',
    });

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const shiftRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
            workspace.id,
            'shift',
            { shouldBypassPermissionChecks: true },
          );

        const shift = await shiftRepository.findOne({ where: { id: shiftId } });

        if (!isDefined(shift)) {
          throw new UserInputError('Shift not found');
        }

        if (!isDefined(shift.checkInAt)) {
          throw new UserInputError('Not checked in yet');
        }

        if (isDefined(shift.checkOutAt)) {
          throw new UserInputError('Already checked out');
        }

        const now = new Date();

        const workingMinutes = computePayableMinutes({
          checkInAt: new Date(shift.checkInAt),
          checkOutAt: now,
          startTime: shift.startTime,
          endTime: shift.endTime,
        });

        await shiftRepository.update(
          { id: shiftId },
          {
            checkOutAt: now.toISOString(),
            status: 'COMPLETED',
            workingMinutes,
            ...(isNonEmptyString(handoverNote) ? { handoverNote } : {}),
          },
        );

        return true;
      },
      authContext,
    );
  }

  async cancel(
    authContext: WorkspaceAuthContext,
    shiftId: string,
    reason: string,
    category: string,
  ): Promise<boolean> {
    await assertShiftOwnerOrElevatedOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      shiftId,
      operation: 'write',
    });

    if (reason.trim().length < 10) {
      throw new UserInputError('Cancel reason must be at least 10 characters');
    }

    if (!(CANCEL_CATEGORIES as readonly string[]).includes(category)) {
      throw new UserInputError(`Invalid cancel category: ${category}`);
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const shiftRepository =
          await this.globalWorkspaceOrmManager.getRepository<ShiftWorkspaceEntity>(
            workspace.id,
            'shift',
            { shouldBypassPermissionChecks: true },
          );

        const shift = await shiftRepository.findOne({ where: { id: shiftId } });

        if (!isDefined(shift)) {
          throw new UserInputError('Shift not found');
        }

        if (shift.status === 'CANCELLED') {
          throw new UserInputError('This shift is already cancelled');
        }

        if (shift.status === 'COMPLETED') {
          throw new UserInputError('Completed shifts cannot be cancelled');
        }

        // A shift whose scheduled window has fully elapsed is settled and can no
        // longer be cancelled — past adjustments are a leader's record edit, not a
        // member cancel. Mirrors the client (cancel is hidden for past shifts).
        if (
          isDefined(shift.startTime) &&
          isDefined(shift.endTime) &&
          Date.now() >
            getShiftEndUtcMillis(shift.date, shift.startTime, shift.endTime)
        ) {
          throw new UserInputError(
            'This shift has already ended and can no longer be cancelled',
          );
        }

        await shiftRepository.update(
          { id: shiftId },
          {
            status: 'CANCELLED',
            cancelReason: reason,
            cancelCategory: category,
            cancelledAt: new Date().toISOString(),
          },
        );

        return true;
      },
      authContext,
    );
  }

  private async loadTemplate(
    workspaceId: string,
    shiftTemplateId: string | null,
  ): Promise<ShiftTemplateWorkspaceEntity | null> {
    if (!isDefined(shiftTemplateId)) {
      return null;
    }

    const shiftTemplateRepository =
      await this.globalWorkspaceOrmManager.getRepository<ShiftTemplateWorkspaceEntity>(
        workspaceId,
        'shiftTemplate',
        { shouldBypassPermissionChecks: true },
      );

    return shiftTemplateRepository.findOne({ where: { id: shiftTemplateId } });
  }
}
