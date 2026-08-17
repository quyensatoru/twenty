import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { ShiftCreateOnePreQueryHook } from 'src/modules/shift/query-hooks/shift-create-one.pre-query.hook';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// isElevatedActor reads AsyncLocalStorage via getWorkspaceContext, which
// throws outside a real ORM workspace context — mock both leaf dependencies.
jest.mock('src/engine/twenty-orm/storage/orm-workspace-context.storage');
jest.mock('src/engine/twenty-orm/utils/should-bypass-app-scope.util');

describe('ShiftCreateOnePreQueryHook', () => {
  const objectName = 'shift';

  const memberAuthContext = {
    type: 'user',
    workspace: { id: 'workspace-1' },
    workspaceMemberId: 'member-1',
  } as unknown as WorkspaceAuthContext;

  const regularTemplate = {
    id: 'template-1',
    code: 'SAE-TT-C',
    name: 'Ca chiều',
    startTime: '14:00',
    endTime: '19:00',
    dayKind: 'WEEKDAY',
    isActive: true,
  };

  const holidayOtTemplate = {
    ...regularTemplate,
    id: 'template-ot',
    code: 'SAE-OT-S',
    name: 'OT sáng',
    dayKind: 'HOLIDAY_OT',
  };

  const buildPayload = (
    data: Partial<ShiftWorkspaceEntity>,
  ): CreateOneResolverArgs<ShiftWorkspaceEntity> => ({
    data: data as ShiftWorkspaceEntity,
  });

  const buildHook = ({
    template = regularTemplate,
    existingShifts = [],
    multiplier = 1,
  }: {
    template?: Record<string, unknown> | null;
    existingShifts?: Record<string, unknown>[];
    multiplier?: number;
  } = {}) => {
    const shiftTemplateRepository = {
      findOne: jest.fn().mockResolvedValue(template),
    };
    const shiftRepository = {
      find: jest.fn().mockResolvedValue(existingShifts),
    };
    const globalWorkspaceOrmManager = {
      getRepository: jest
        .fn()
        .mockImplementation((_workspaceId: string, singularName: string) =>
          Promise.resolve(
            singularName === 'shiftTemplate'
              ? shiftTemplateRepository
              : shiftRepository,
          ),
        ),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ShiftCreateOnePreQueryHook(
      globalWorkspaceOrmManager as never,
      {
        getMultiplierForDate: jest.fn().mockResolvedValue(multiplier),
      } as never,
    );
  };

  beforeEach(() => {
    jest.mocked(getWorkspaceContext).mockReturnValue({
      allObjectRecordsRoleFlagsByRoleId: {},
      userWorkspaceRoleMap: {},
      apiKeyRoleMap: {},
    } as never);
    jest.mocked(shouldBypassAppScope).mockReturnValue(false);
  });

  it('rejects an upsert create (the overwrite vector)', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(memberAuthContext, objectName, {
        ...buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
        upsert: true,
      }),
    ).rejects.toThrow('Upsert');
  });

  it('allows a client-supplied id and passes it through (the frontend cache needs it)', async () => {
    // useCreateOneRecord always injects a v4() id; without upsert an id match is
    // a plain INSERT that collides on the primary key, so it cannot overwrite a
    // victim's row — the id is safe to keep and the cache depends on it.
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({
        id: 'client-generated-id',
        date: '2999-01-01',
        shiftTemplateId: 'template-1',
      }),
    );

    expect(result.data.id).toBe('client-generated-id');
    expect(result.data).toMatchObject({
      memberId: 'member-1',
      templateCode: 'SAE-TT-C',
      name: 'SAE-TT-C 2999-01-01',
      status: 'UPCOMING',
    });
  });

  it('rejects a registration for a past date', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({ date: '2020-01-01', shiftTemplateId: 'template-1' }),
      ),
    ).rejects.toThrow('past date');
  });

  it('rejects a registration whose start time has already passed today', async () => {
    // now = 2026-08-15 22:00 ICT; today's 14:00 slot has already started.
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-15T15:00:00Z'));
    try {
      const hook = buildHook();

      await expect(
        hook.execute(
          memberAuthContext,
          objectName,
          buildPayload({ date: '2026-08-15', shiftTemplateId: 'template-1' }),
        ),
      ).rejects.toThrow('already passed');
    } finally {
      jest.useRealTimers();
    }
  });

  it('rejects a registration without a shift template', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({ date: '2999-01-01' }),
      ),
    ).rejects.toThrow('shift template');
  });

  it('rejects a registration on a missing template', async () => {
    const hook = buildHook({ template: null });

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-404' }),
      ),
    ).rejects.toThrow('not found or inactive');
  });

  it('rejects a registration on an inactive template', async () => {
    const hook = buildHook({
      template: { ...regularTemplate, isActive: false },
    });

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
      ),
    ).rejects.toThrow('not found or inactive');
  });

  it('snapshots template fields and stamps the OT multiplier', async () => {
    const hook = buildHook({ multiplier: 2 });

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
    );

    expect(result.data).toMatchObject({
      memberId: 'member-1',
      templateCode: 'SAE-TT-C',
      templateName: 'Ca chiều',
      startTime: '14:00',
      endTime: '19:00',
      name: 'SAE-TT-C 2999-01-01',
      status: 'UPCOMING',
      rateMultiplier: 2,
    });
  });

  it('stamps no rate multiplier on an ordinary day', async () => {
    const hook = buildHook({ multiplier: 1 });

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
    );

    expect(result.data.rateMultiplier).toBeNull();
  });

  it('rejects a duplicate active registration for the same member/date/template', async () => {
    const hook = buildHook({
      existingShifts: [
        { id: 'shift-1', memberId: 'member-1', status: 'UPCOMING' },
      ],
    });

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
      ),
    ).rejects.toThrow('already registered');
  });

  it('allows re-registration when the previous registration was cancelled', async () => {
    const hook = buildHook({
      existingShifts: [
        { id: 'shift-1', memberId: 'member-1', status: 'CANCELLED' },
      ],
    });

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
    );

    expect(result.data.name).toBe('SAE-TT-C 2999-01-01');
  });

  it('rejects a HOLIDAY_OT slot already taken by ANOTHER member (OT slots are exclusive)', async () => {
    // TC rule: "Không đăng kí trùng ca nhau" — one person per OT slot per day
    const hook = buildHook({
      template: holidayOtTemplate,
      existingShifts: [
        { id: 'shift-1', memberId: 'someone-else', status: 'UPCOMING' },
      ],
    });

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-ot' }),
      ),
    ).rejects.toThrow('OT slot is already taken');
  });

  it('allows a regular shift when another member holds the same template/date', async () => {
    const hook = buildHook({
      existingShifts: [
        { id: 'shift-1', memberId: 'someone-else', status: 'UPCOMING' },
      ],
    });

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
    );

    expect(result.data.memberId).toBe('member-1');
  });

  it('rejects an ordinary member registering a shift for someone else', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload({
          date: '2999-01-01',
          shiftTemplateId: 'template-1',
          memberId: 'member-2',
        }),
      ),
    ).rejects.toThrow(PermissionsException);
  });

  it('lets an elevated actor register on behalf of another member', async () => {
    jest.mocked(shouldBypassAppScope).mockReturnValue(true);
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({
        date: '2999-01-01',
        shiftTemplateId: 'template-1',
        memberId: 'member-2',
      }),
    );

    expect(result.data.memberId).toBe('member-2');
  });

  it('defaults the member to the acting member when none is provided', async () => {
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({ date: '2999-01-01', shiftTemplateId: 'template-1' }),
    );

    expect(result.data.memberId).toBe('member-1');
  });

  it('strips client-sent attendance fields at creation', async () => {
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload({
        date: '2999-01-01',
        shiftTemplateId: 'template-1',
        status: 'COMPLETED',
        checkInAt: '2999-01-01T07:00:00.000Z',
        checkOutAt: '2999-01-01T12:00:00.000Z',
        checkInLateMinutes: 0,
        workingMinutes: 999,
        cancelReason: 'client-sent',
        cancelCategory: 'PERSONAL',
        cancelledAt: '2999-01-01T00:00:00.000Z',
      }),
    );

    expect(result.data).toMatchObject({
      status: 'UPCOMING',
      checkInAt: null,
      checkOutAt: null,
      checkInLateMinutes: null,
      workingMinutes: null,
      cancelReason: null,
      cancelCategory: null,
      cancelledAt: null,
    });
  });
});
