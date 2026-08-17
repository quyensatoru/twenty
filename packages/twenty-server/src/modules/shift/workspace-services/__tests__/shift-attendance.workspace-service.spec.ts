import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ShiftAttendanceWorkspaceService } from 'src/modules/shift/workspace-services/shift-attendance.workspace-service';
import { getTodayIct } from 'src/modules/shift/utils/shift-time.util';

// Captured with real timers at module load — used to build absolute instants
// whose ICT wall-clock is a given HH:mm today. new Date(<string>) is NOT faked
// by jest fake timers (only new Date() with no args / Date.now() are), so these
// stay correct while jest.setSystemTime controls what the service reads.
const todayIct = getTodayIct();
const ictDate = (hhmm: string): Date =>
  new Date(`${todayIct}T${hhmm}:00+07:00`);

describe('ShiftAttendanceWorkspaceService', () => {
  // Owner actor: assertShiftOwnerOrElevatedOrThrow short-circuits on ownership
  // (memberId match), so no workspace-context mock is needed.
  const ownerAuthContext = {
    type: 'user',
    workspace: { id: 'workspace-1' },
    workspaceMemberId: 'member-1',
  } as unknown as WorkspaceAuthContext;

  const buildService = ({
    shift,
    template = null,
  }: {
    shift: Record<string, unknown> | null;
    template?: Record<string, unknown> | null;
  }) => {
    const shiftRepository = {
      findOne: jest.fn().mockResolvedValue(shift),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const templateRepository = {
      findOne: jest.fn().mockResolvedValue(template),
    };
    const globalWorkspaceOrmManager = {
      getRepository: jest
        .fn()
        .mockImplementation((_workspaceId: string, singularName: string) =>
          Promise.resolve(
            singularName === 'shiftTemplate'
              ? templateRepository
              : shiftRepository,
          ),
        ),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    const service = new ShiftAttendanceWorkspaceService(
      globalWorkspaceOrmManager as never,
    );

    return { service, shiftRepository, templateRepository };
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkIn', () => {
    it('rejects when the shift is not UPCOMING', async () => {
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'COMPLETED',
          date: todayIct,
          startTime: '14:00',
          checkInAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15 },
      });

      await expect(
        service.checkIn(ownerAuthContext, 'shift-1'),
      ).rejects.toThrow('not open for check-in');
      expect(shiftRepository.update).not.toHaveBeenCalled();
    });

    it('rejects before the early window opens', async () => {
      // Shift today 14:00-19:00, earlyCheckInMinutes 15 -> opens 13:45 ICT.
      jest.setSystemTime(ictDate('13:00'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15 },
      });

      await expect(
        service.checkIn(ownerAuthContext, 'shift-1'),
      ).rejects.toThrow('Too early to check in');
      expect(shiftRepository.update).not.toHaveBeenCalled();
    });

    it('rejects after the scheduled window has ended (too late — missed)', async () => {
      // Shift today 14:00-19:00; now = 20:00 ICT is past the 19:00 end. The
      // upper bound fires even with no early padding configured.
      jest.setSystemTime(ictDate('20:00'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: null },
      });

      await expect(
        service.checkIn(ownerAuthContext, 'shift-1'),
      ).rejects.toThrow('Too late to check in');
      expect(shiftRepository.update).not.toHaveBeenCalled();
    });

    it('stamps checkInAt, the NO-grace late flag, and moves to IN_PROGRESS', async () => {
      // now = 14:02 ICT for a 14:00 shift -> +2 late.
      jest.setSystemTime(ictDate('14:02'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15 },
      });

      const result = await service.checkIn(ownerAuthContext, 'shift-1');

      expect(result).toBe(true);
      expect(shiftRepository.update).toHaveBeenCalledWith(
        { id: 'shift-1' },
        {
          checkInAt: ictDate('14:02').toISOString(),
          status: 'IN_PROGRESS',
          checkInLateMinutes: 2,
        },
      );
    });

    it('on time (or early) stores checkInLateMinutes: null', async () => {
      // now = 14:00 ICT exactly for a 14:00 shift -> not late (NO grace: >=1 min).
      jest.setSystemTime(ictDate('14:00'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15 },
      });

      await service.checkIn(ownerAuthContext, 'shift-1');

      expect(shiftRepository.update).toHaveBeenCalledWith(
        { id: 'shift-1' },
        expect.objectContaining({
          status: 'IN_PROGRESS',
          checkInLateMinutes: null,
        }),
      );
    });

    it('rejects when already checked in', async () => {
      const { service } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
          startTime: '14:00',
          checkInAt: ictDate('14:00').toISOString(),
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15 },
      });

      await expect(
        service.checkIn(ownerAuthContext, 'shift-1'),
      ).rejects.toThrow('Already checked in');
    });
  });

  describe('checkOut', () => {
    it('computes capped payable minutes and completes the shift', async () => {
      // Checked in 14:00, out 20:30 -> elapsed 390, capped to window width 345.
      jest.setSystemTime(ictDate('20:30'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'IN_PROGRESS',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: ictDate('14:00').toISOString(),
          checkOutAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
      });

      const result = await service.checkOut(ownerAuthContext, 'shift-1', null);

      expect(result).toBe(true);
      expect(shiftRepository.update).toHaveBeenCalledWith(
        { id: 'shift-1' },
        expect.objectContaining({
          checkOutAt: ictDate('20:30').toISOString(),
          status: 'COMPLETED',
          workingMinutes: 345,
        }),
      );
    });

    it('persists the handover note when provided', async () => {
      jest.setSystemTime(ictDate('19:05'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'IN_PROGRESS',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: ictDate('14:00').toISOString(),
          checkOutAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
      });

      await service.checkOut(
        ownerAuthContext,
        'shift-1',
        'Handed over inventory count',
      );

      expect(shiftRepository.update).toHaveBeenCalledWith(
        { id: 'shift-1' },
        expect.objectContaining({
          status: 'COMPLETED',
          handoverNote: 'Handed over inventory count',
        }),
      );
    });

    it('rejects when not checked in yet', async () => {
      const { service } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
          startTime: '14:00',
          endTime: '19:00',
          checkInAt: null,
          checkOutAt: null,
          shiftTemplateId: 'template-1',
        },
        template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
      });

      await expect(
        service.checkOut(ownerAuthContext, 'shift-1', null),
      ).rejects.toThrow('Not checked in yet');
    });
  });

  describe('cancel', () => {
    it('requires a reason of at least 10 characters and a valid category', async () => {
      const { service } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
        },
      });

      await expect(
        service.cancel(ownerAuthContext, 'shift-1', 'too short', 'SICK'),
      ).rejects.toThrow('at least 10 characters');

      await expect(
        service.cancel(
          ownerAuthContext,
          'shift-1',
          'a valid long reason',
          'BOGUS',
        ),
      ).rejects.toThrow('category');
    });

    it('rejects an already-cancelled shift', async () => {
      const { service } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'CANCELLED',
          date: todayIct,
        },
      });

      await expect(
        service.cancel(
          ownerAuthContext,
          'shift-1',
          'legitimate cancellation reason',
          'SICK',
        ),
      ).rejects.toThrow('already cancelled');
    });

    it('cancels an UPCOMING shift with reason, category and timestamp', async () => {
      jest.setSystemTime(ictDate('09:00'));
      const { service, shiftRepository } = buildService({
        shift: {
          id: 'shift-1',
          memberId: 'member-1',
          status: 'UPCOMING',
          date: todayIct,
        },
      });

      const result = await service.cancel(
        ownerAuthContext,
        'shift-1',
        'family emergency came up',
        'PERSONAL',
      );

      expect(result).toBe(true);
      expect(shiftRepository.update).toHaveBeenCalledWith(
        { id: 'shift-1' },
        {
          status: 'CANCELLED',
          cancelReason: 'family emergency came up',
          cancelCategory: 'PERSONAL',
          cancelledAt: ictDate('09:00').toISOString(),
        },
      );
    });
  });
});
