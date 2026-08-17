import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ShiftRateWorkspaceService } from 'src/modules/shift/query-hooks/shift-rate.workspace-service';

describe('ShiftRateWorkspaceService.getMultiplierForDate', () => {
  const mockAuthContext = {
    workspace: { id: 'workspace-1' },
  } as WorkspaceAuthContext;

  const buildService = (specialDays: unknown[]) => {
    const specialDayRepository = {
      find: jest.fn().mockResolvedValue(specialDays),
    };
    const globalWorkspaceOrmManager = {
      getRepository: jest.fn().mockResolvedValue(specialDayRepository),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ShiftRateWorkspaceService(globalWorkspaceOrmManager as never);
  };

  it('returns 1 when no special day matches', async () => {
    const service = buildService([]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-08-12'),
    ).toBe(1);
  });

  it('matches a yearly special day by month and day', async () => {
    const service = buildService([
      {
        kind: 'YEARLY',
        month: 9,
        day: 2,
        date: null,
        multiplier: 2,
        isActive: true,
      },
    ]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-09-02'),
    ).toBe(2);
  });

  it('matches a specific special day by exact date only', async () => {
    const service = buildService([
      {
        kind: 'SPECIFIC',
        month: null,
        day: null,
        date: '2026-02-16',
        multiplier: 3,
        isActive: true,
      },
    ]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-02-17'),
    ).toBe(1);
    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-02-16'),
    ).toBe(3);
  });

  it('returns the highest multiplier when several match', async () => {
    const service = buildService([
      {
        kind: 'SPECIFIC',
        month: null,
        day: null,
        date: '2026-02-16',
        multiplier: 2,
        isActive: true,
      },
      {
        kind: 'YEARLY',
        month: 2,
        day: 16,
        date: null,
        multiplier: 1.5,
        isActive: true,
      },
    ]);

    expect(
      await service.getMultiplierForDate(mockAuthContext, '2026-02-16'),
    ).toBe(2);
  });
});
