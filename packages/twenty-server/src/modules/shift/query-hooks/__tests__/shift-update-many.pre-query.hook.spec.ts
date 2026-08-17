import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { ShiftUpdateManyPreQueryHook } from 'src/modules/shift/query-hooks/shift-update-many.pre-query.hook';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// isElevatedActor reads AsyncLocalStorage via getWorkspaceContext, which throws
// outside a real ORM workspace context — mock both leaf dependencies.
jest.mock('src/engine/twenty-orm/storage/orm-workspace-context.storage');
jest.mock('src/engine/twenty-orm/utils/should-bypass-app-scope.util');

describe('ShiftUpdateManyPreQueryHook', () => {
  const objectName = 'shift';

  const memberAuthContext = {
    type: 'user',
    workspace: { id: 'workspace-1' },
    workspaceMemberId: 'member-1',
  } as unknown as WorkspaceAuthContext;

  const buildPayload = (): UpdateManyResolverArgs<ShiftWorkspaceEntity> => ({
    filter: { id: { in: ['shift-1', 'shift-2'] } },
    data: { status: 'CANCELLED' } as ShiftWorkspaceEntity,
  });

  const buildHook = () => {
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ShiftUpdateManyPreQueryHook(globalWorkspaceOrmManager as never);
  };

  beforeEach(() => {
    jest.mocked(getWorkspaceContext).mockReturnValue({
      allObjectRecordsRoleFlagsByRoleId: {},
      userWorkspaceRoleMap: {},
      apiKeyRoleMap: {},
    } as never);
    jest.mocked(shouldBypassAppScope).mockReturnValue(false);
  });

  it('rejects a bulk update from a non-elevated member', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(memberAuthContext, objectName, buildPayload()),
    ).rejects.toThrow(PermissionsException);
  });

  it('passes the payload through unchanged for an elevated actor', async () => {
    jest.mocked(shouldBypassAppScope).mockReturnValue(true);
    const hook = buildHook();
    const payload = buildPayload();

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result).toBe(payload);
  });
});
