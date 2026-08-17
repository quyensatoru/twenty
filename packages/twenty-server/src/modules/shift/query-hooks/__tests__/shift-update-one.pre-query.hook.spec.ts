import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { ShiftUpdateOnePreQueryHook } from 'src/modules/shift/query-hooks/shift-update-one.pre-query.hook';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// isElevatedActor / the owner assert read AsyncLocalStorage via getWorkspaceContext
// + shouldBypassAppScope, which throw outside a real ORM context — mock both.
jest.mock('src/engine/twenty-orm/storage/orm-workspace-context.storage');
jest.mock('src/engine/twenty-orm/utils/should-bypass-app-scope.util');

describe('ShiftUpdateOnePreQueryHook', () => {
  const objectName = 'shift';

  const memberAuthContext = {
    type: 'user',
    workspace: { id: 'workspace-1' },
    workspaceMemberId: 'member-1',
  } as unknown as WorkspaceAuthContext;

  const ownShift = { id: 'shift-1', memberId: 'member-1' };
  const othersShift = { id: 'shift-2', memberId: 'member-2' };

  const buildPayload = (
    id: string,
    data: Partial<ShiftWorkspaceEntity>,
  ): UpdateOneResolverArgs<ShiftWorkspaceEntity> => ({
    id,
    data: data as ShiftWorkspaceEntity,
  });

  const buildHook = (shift: Record<string, unknown> = ownShift) => {
    const shiftRepository = {
      findOne: jest.fn().mockResolvedValue(shift),
    };
    const globalWorkspaceOrmManager = {
      getRepository: jest.fn().mockResolvedValue(shiftRepository),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ShiftUpdateOnePreQueryHook(globalWorkspaceOrmManager as never);
  };

  beforeEach(() => {
    jest.mocked(getWorkspaceContext).mockReturnValue({
      allObjectRecordsRoleFlagsByRoleId: {},
      userWorkspaceRoleMap: {},
      apiKeyRoleMap: {},
    } as never);
    // Default: non-elevated (ordinary member).
    jest.mocked(shouldBypassAppScope).mockReturnValue(false);
  });

  it('rejects a member widening endTime on their own shift (pay-inflation vector)', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload('shift-1', { endTime: '23:00' }),
      ),
    ).rejects.toThrow(PermissionsException);
  });

  it('rejects a member editing startTime / date on their own shift', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload('shift-1', { startTime: '00:00' }),
      ),
    ).rejects.toThrow(PermissionsException);

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload('shift-1', { date: '2999-01-01' }),
      ),
    ).rejects.toThrow(PermissionsException);
  });

  it('rejects a member re-pointing the template snapshot on their own shift', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload('shift-1', { shiftTemplateId: 'template-2' }),
      ),
    ).rejects.toThrow(PermissionsException);
  });

  it('rejects a member editing checkInAt on their own shift (regression)', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload('shift-1', {
          checkInAt: '2999-01-01T07:00:00.000Z',
        }),
      ),
    ).rejects.toThrow(PermissionsException);
  });

  it('allows a member editing the handover note on their own shift', async () => {
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload('shift-1', { handoverNote: 'Bàn giao cho ca sau' }),
    );

    expect(result.data.handoverNote).toBe('Bàn giao cho ca sau');
  });

  it("rejects a member editing another member's shift (IDOR)", async () => {
    const hook = buildHook(othersShift);

    await expect(
      hook.execute(
        memberAuthContext,
        objectName,
        buildPayload('shift-2', { handoverNote: 'not mine' }),
      ),
    ).rejects.toThrow(PermissionsException);
  });

  it('lets an elevated actor edit a scheduling snapshot field', async () => {
    jest.mocked(shouldBypassAppScope).mockReturnValue(true);
    const hook = buildHook();

    const result = await hook.execute(
      memberAuthContext,
      objectName,
      buildPayload('shift-1', { endTime: '23:00' }),
    );

    expect(result.data.endTime).toBe('23:00');
  });
});
