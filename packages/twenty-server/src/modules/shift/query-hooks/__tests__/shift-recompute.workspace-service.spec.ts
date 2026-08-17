import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ShiftRecomputeWorkspaceService } from 'src/modules/shift/query-hooks/shift-recompute.workspace-service';

describe('ShiftRecomputeWorkspaceService.recomputeAttendance', () => {
  const mockAuthContext = {
    workspace: { id: 'workspace-1' },
  } as WorkspaceAuthContext;

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

    const service = new ShiftRecomputeWorkspaceService(
      globalWorkspaceOrmManager as never,
    );

    return { service, shiftRepository, templateRepository };
  };

  it('completes the shift, recomputes capped payable minutes and the late flag when both punches are set', async () => {
    const { service, shiftRepository } = buildService({
      shift: {
        id: 'shift-1',
        status: 'IN_PROGRESS',
        date: '2026-08-11',
        startTime: '14:00',
        endTime: '19:00',
        shiftTemplateId: 'template-1',
        checkInAt: '2026-08-11T07:05:00Z', // 14:05 ICT -> late +5 (NO grace)
        checkOutAt: '2026-08-11T12:05:00Z', // 19:05 ICT
        checkInLateMinutes: null,
        workingMinutes: null,
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
    });

    await service.recomputeAttendance(mockAuthContext, 'shift-1');

    expect(shiftRepository.update).toHaveBeenCalledWith(
      { id: 'shift-1' },
      expect.objectContaining({
        status: 'COMPLETED',
        workingMinutes: 300,
        checkInLateMinutes: 5,
      }),
    );
  });

  it('moves a shift with only a check-in to IN_PROGRESS with null workingMinutes', async () => {
    const { service, shiftRepository } = buildService({
      shift: {
        id: 'shift-1',
        status: 'UPCOMING',
        date: '2026-08-11',
        startTime: '14:00',
        endTime: '19:00',
        shiftTemplateId: 'template-1',
        checkInAt: '2026-08-11T07:05:00Z', // 14:05 ICT -> late +5
        checkOutAt: null,
        checkInLateMinutes: null,
        workingMinutes: null,
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
    });

    await service.recomputeAttendance(mockAuthContext, 'shift-1');

    expect(shiftRepository.update).toHaveBeenCalledWith(
      { id: 'shift-1' },
      expect.objectContaining({
        status: 'IN_PROGRESS',
        workingMinutes: null,
        checkInLateMinutes: 5,
      }),
    );
  });

  it('resets a shift with both punches cleared back to UPCOMING', async () => {
    const { service, shiftRepository } = buildService({
      shift: {
        id: 'shift-1',
        status: 'IN_PROGRESS',
        date: '2026-08-11',
        startTime: '14:00',
        endTime: '19:00',
        shiftTemplateId: 'template-1',
        checkInAt: null,
        checkOutAt: null,
        checkInLateMinutes: 5,
        workingMinutes: null,
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
    });

    await service.recomputeAttendance(mockAuthContext, 'shift-1');

    expect(shiftRepository.update).toHaveBeenCalledWith(
      { id: 'shift-1' },
      expect.objectContaining({
        status: 'UPCOMING',
        workingMinutes: null,
        checkInLateMinutes: null,
      }),
    );
  });

  it('never touches a CANCELLED shift', async () => {
    const { service, shiftRepository } = buildService({
      shift: {
        id: 'shift-1',
        status: 'CANCELLED',
        date: '2026-08-11',
        startTime: '14:00',
        endTime: '19:00',
        shiftTemplateId: 'template-1',
        checkInAt: '2026-08-11T07:05:00Z',
        checkOutAt: '2026-08-11T12:05:00Z',
        checkInLateMinutes: null,
        workingMinutes: null,
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
    });

    await service.recomputeAttendance(mockAuthContext, 'shift-1');

    expect(shiftRepository.update).not.toHaveBeenCalled();
  });

  it('writes when exactly one derived field is stale', async () => {
    const { service, shiftRepository } = buildService({
      shift: {
        id: 'shift-1',
        status: 'COMPLETED',
        date: '2026-08-11',
        startTime: '14:00',
        endTime: '19:00',
        shiftTemplateId: 'template-1',
        checkInAt: '2026-08-11T07:05:00Z', // 14:05 ICT -> late +5
        checkOutAt: '2026-08-11T12:05:00Z', // 19:05 ICT
        checkInLateMinutes: 0, // stale: punch implies +5, not 0
        workingMinutes: 300,
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
    });

    await service.recomputeAttendance(mockAuthContext, 'shift-1');

    expect(shiftRepository.update).toHaveBeenCalledWith(
      { id: 'shift-1' },
      expect.objectContaining({
        status: 'COMPLETED',
        workingMinutes: 300,
        checkInLateMinutes: 5,
      }),
    );
  });

  it('skips the write when nothing would change', async () => {
    const { service, shiftRepository } = buildService({
      shift: {
        id: 'shift-1',
        status: 'COMPLETED',
        date: '2026-08-11',
        startTime: '14:00',
        endTime: '19:00',
        shiftTemplateId: 'template-1',
        checkInAt: '2026-08-11T07:05:00Z',
        checkOutAt: '2026-08-11T12:05:00Z',
        checkInLateMinutes: 5,
        workingMinutes: 300,
      },
      template: { earlyCheckInMinutes: 15, lateCheckOutMinutes: 30 },
    });

    await service.recomputeAttendance(mockAuthContext, 'shift-1');

    expect(shiftRepository.update).not.toHaveBeenCalled();
  });
});
