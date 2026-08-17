import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { ShiftCreateManyPreQueryHook } from 'src/modules/shift/query-hooks/shift-create-many.pre-query.hook';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// isElevatedActor reads AsyncLocalStorage via getWorkspaceContext, which throws
// outside a real ORM workspace context — mock both leaf dependencies.
jest.mock('src/engine/twenty-orm/storage/orm-workspace-context.storage');
jest.mock('src/engine/twenty-orm/utils/should-bypass-app-scope.util');

describe('ShiftCreateManyPreQueryHook', () => {
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

  const buildPayload = (
    data: Partial<ShiftWorkspaceEntity>[],
    upsert?: boolean,
  ): CreateManyResolverArgs<ShiftWorkspaceEntity> => ({
    data: data as ShiftWorkspaceEntity[],
    ...(upsert === undefined ? {} : { upsert }),
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

    return new ShiftCreateManyPreQueryHook(
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

  it('rejects an upsert create-many (the overwrite vector)', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload(
          [{ date: '2999-01-01', shiftTemplateId: 'template-1' }],
          true,
        ),
      ),
    ).rejects.toThrow('Upsert');
  });

  it('allows client-supplied ids on every element and passes them through', async () => {
    // Each element carries a client-generated v4() id; without upsert these are
    // plain INSERTs that collide on the primary key rather than overwrite, so
    // the ids pass through untouched for the Apollo cache.
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload([
        {
          id: 'client-id-1',
          date: '2999-01-01',
          shiftTemplateId: 'template-1',
        },
        {
          id: 'client-id-2',
          date: '2999-01-02',
          shiftTemplateId: 'template-1',
        },
      ]),
    );

    expect(result.data.map((record) => record.id)).toEqual([
      'client-id-1',
      'client-id-2',
    ]);
    result.data.forEach((record) => {
      expect(record).toMatchObject({
        memberId: 'member-1',
        templateCode: 'SAE-TT-C',
        status: 'UPCOMING',
      });
    });
  });

  it('stamps every record in a valid two-element batch', async () => {
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload([
        { date: '2999-01-01', shiftTemplateId: 'template-1' },
        { date: '2999-01-02', shiftTemplateId: 'template-1' },
      ]),
    );

    expect(result.data).toHaveLength(2);
    result.data.forEach((record) => {
      expect(record).toMatchObject({
        memberId: 'member-1',
        templateCode: 'SAE-TT-C',
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
    expect(result.data[0].name).toBe('SAE-TT-C 2999-01-01');
    expect(result.data[1].name).toBe('SAE-TT-C 2999-01-02');
  });

  it('rejects the whole batch when one element has a past date', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload([
          { date: '2999-01-01', shiftTemplateId: 'template-1' },
          { date: '2020-01-01', shiftTemplateId: 'template-1' },
        ]),
      ),
    ).rejects.toThrow('past date');
  });
});
