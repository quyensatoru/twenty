import { type FindManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { ShiftFindManyPreQueryHook } from 'src/modules/shift/query-hooks/shift-find-many.pre-query.hook';

// isElevatedActor reads AsyncLocalStorage via getWorkspaceContext, which throws
// outside a real ORM workspace context — mock both leaf dependencies.
jest.mock('src/engine/twenty-orm/storage/orm-workspace-context.storage');
jest.mock('src/engine/twenty-orm/utils/should-bypass-app-scope.util');

describe('ShiftFindManyPreQueryHook', () => {
  const objectName = 'shift';

  const memberAuthContext = {
    type: 'user',
    workspace: { id: 'workspace-1' },
    workspaceMemberId: 'member-1',
  } as unknown as WorkspaceAuthContext;

  const apiKeyAuthContext = {
    type: 'apiKey',
    workspace: { id: 'workspace-1' },
  } as unknown as WorkspaceAuthContext;

  const buildHook = () => {
    const globalWorkspaceOrmManager = {
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ShiftFindManyPreQueryHook(globalWorkspaceOrmManager as never);
  };

  beforeEach(() => {
    jest.mocked(getWorkspaceContext).mockReturnValue({
      allObjectRecordsRoleFlagsByRoleId: {},
      userWorkspaceRoleMap: {},
      apiKeyRoleMap: {},
    } as never);
    jest.mocked(shouldBypassAppScope).mockReturnValue(false);
  });

  it('injects memberId = self when a non-elevated member has no filter', async () => {
    const hook = buildHook();
    const payload: FindManyResolverArgs = {};

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result.filter).toEqual({ memberId: { eq: 'member-1' } });
  });

  it('ANDs memberId = self onto a non-elevated member existing filter', async () => {
    const hook = buildHook();
    const payload: FindManyResolverArgs = {
      filter: { status: { eq: 'UPCOMING' } },
    };

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result.filter).toEqual({
      and: [{ status: { eq: 'UPCOMING' } }, { memberId: { eq: 'member-1' } }],
    });
  });

  it('cannot return another member rows when the caller targets someone else', async () => {
    // The caller-supplied memberId=other is ANDed with memberId=self, so the
    // SELECT can only match rows that are BOTH — an impossible set: no leak.
    const hook = buildHook();
    const payload: FindManyResolverArgs = {
      filter: { memberId: { eq: 'member-2' } },
    };

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result.filter).toEqual({
      and: [{ memberId: { eq: 'member-2' } }, { memberId: { eq: 'member-1' } }],
    });
  });

  it('leaves the filter untouched for an elevated actor', async () => {
    jest.mocked(shouldBypassAppScope).mockReturnValue(true);
    const hook = buildHook();
    const payload: FindManyResolverArgs = {
      filter: { memberId: { eq: 'member-2' } },
    };

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result).toBe(payload);
    expect(result.filter).toEqual({ memberId: { eq: 'member-2' } });
  });

  it('denies a non-elevated actor that has no workspace member (API key)', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(apiKeyAuthContext, objectName, {}),
    ).rejects.toThrow(PermissionsException);
  });
});
