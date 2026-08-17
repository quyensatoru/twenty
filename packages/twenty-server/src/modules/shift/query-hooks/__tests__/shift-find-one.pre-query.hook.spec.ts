import { type FindOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { ShiftFindOnePreQueryHook } from 'src/modules/shift/query-hooks/shift-find-one.pre-query.hook';

// isElevatedActor reads AsyncLocalStorage via getWorkspaceContext, which throws
// outside a real ORM workspace context — mock both leaf dependencies.
jest.mock('src/engine/twenty-orm/storage/orm-workspace-context.storage');
jest.mock('src/engine/twenty-orm/utils/should-bypass-app-scope.util');

describe('ShiftFindOnePreQueryHook', () => {
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

    return new ShiftFindOnePreQueryHook(globalWorkspaceOrmManager as never);
  };

  beforeEach(() => {
    jest.mocked(getWorkspaceContext).mockReturnValue({
      allObjectRecordsRoleFlagsByRoleId: {},
      userWorkspaceRoleMap: {},
      apiKeyRoleMap: {},
    } as never);
    jest.mocked(shouldBypassAppScope).mockReturnValue(false);
  });

  it('ANDs memberId = self onto the id lookup for a non-elevated member', async () => {
    const hook = buildHook();
    const payload: FindOneResolverArgs = {
      filter: { id: { eq: 'shift-1' } },
    };

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result.filter).toEqual({
      and: [{ id: { eq: 'shift-1' } }, { memberId: { eq: 'member-1' } }],
    });
  });

  it('cannot resolve a foreign record — a non-owned id is ANDed with memberId = self', async () => {
    // The member fetches someone else's shift by id. The self constraint makes
    // the SELECT match nothing, so the runner raises RECORD_NOT_FOUND: no leak.
    const hook = buildHook();
    const payload: FindOneResolverArgs = {
      filter: { id: { eq: 'someone-elses-shift' } },
    };

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result.filter).toEqual({
      and: [
        { id: { eq: 'someone-elses-shift' } },
        { memberId: { eq: 'member-1' } },
      ],
    });
  });

  it('leaves the filter untouched for an elevated actor', async () => {
    jest.mocked(shouldBypassAppScope).mockReturnValue(true);
    const hook = buildHook();
    const payload: FindOneResolverArgs = {
      filter: { id: { eq: 'shift-1' } },
    };

    const result = await hook.execute(memberAuthContext, objectName, payload);

    expect(result).toBe(payload);
    expect(result.filter).toEqual({ id: { eq: 'shift-1' } });
  });

  it('denies a non-elevated actor that has no workspace member (API key)', async () => {
    const hook = buildHook();

    await expect(
      hook.execute(apiKeyAuthContext, objectName, {
        filter: { id: { eq: 'shift-1' } },
      }),
    ).rejects.toThrow(PermissionsException);
  });
});
