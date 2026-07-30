import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ProjectCreateOnePreQueryHook } from 'src/modules/project/query-hooks/project-create-one.pre-query.hook';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

describe('ProjectCreateOnePreQueryHook', () => {
  const authContext = {
    workspace: { id: 'workspace-1' },
  } as WorkspaceAuthContext;
  const objectName = 'project';

  const buildPayload = (
    data: Partial<ProjectWorkspaceEntity>,
  ): CreateOneResolverArgs<ProjectWorkspaceEntity> => ({
    data: data as ProjectWorkspaceEntity,
  });

  const buildHook = (existingKeys: string[]) => {
    const mockProjectRepository = {
      exists: jest
        .fn()
        .mockImplementation(({ where: { key } }) =>
          Promise.resolve(existingKeys.includes(key)),
        ),
    };
    const mockGlobalWorkspaceOrmManager = {
      getRepository: jest.fn().mockResolvedValue(mockProjectRepository),
      executeInWorkspaceContext: jest
        .fn()
        .mockImplementation((fn: () => unknown) => fn()),
    };

    return new ProjectCreateOnePreQueryHook(
      mockGlobalWorkspaceOrmManager as never,
    );
  };

  it('generates a key from the project name when none is provided', async () => {
    const hook = buildHook([]);

    const result = await hook.execute(
      authContext,
      objectName,
      buildPayload({ name: 'Website Redesign' }),
    );

    expect(result.data.key).toBe('WR');
  });

  it('does not overwrite a key explicitly provided in the payload', async () => {
    const hook = buildHook([]);

    const result = await hook.execute(
      authContext,
      objectName,
      buildPayload({ name: 'Website Redesign', key: 'CUSTOM' }),
    );

    expect(result.data.key).toBe('CUSTOM');
  });

  it('leaves key undefined when no name is provided', async () => {
    const hook = buildHook([]);

    const result = await hook.execute(
      authContext,
      objectName,
      buildPayload({}),
    );

    expect(result.data.key).toBeUndefined();
  });

  it('appends a numeric suffix when the generated key already exists', async () => {
    const hook = buildHook(['WR', 'WR2']);

    const result = await hook.execute(
      authContext,
      objectName,
      buildPayload({ name: 'Website Redesign' }),
    );

    expect(result.data.key).toBe('WR3');
  });
});
