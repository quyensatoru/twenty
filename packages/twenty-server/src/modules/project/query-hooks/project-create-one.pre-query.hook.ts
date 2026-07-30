import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { buildProjectKeyFromName } from 'src/modules/project/query-hooks/utils/build-project-key-from-name.util';
import { ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

// `project` is the app-scope root — its own `appId` IS the effective app,
// so the write-guard needs no DB lookup here (0 hops).
@Injectable()
@WorkspaceQueryHook(`project.createOne`)
export class ProjectCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<ProjectWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<ProjectWorkspaceEntity>> {
    if (isDefined(payload.data.appId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        objectNameSingular: 'project',
        foreignKeyValue: payload.data.appId,
      });
    }

    if (
      isNonEmptyString(payload.data.key) ||
      !isNonEmptyString(payload.data.name)
    ) {
      return payload;
    }

    payload.data.key = await this.generateUniqueKey(
      payload.data.name,
      authContext,
    );

    return payload;
  }

  private async generateUniqueKey(
    name: string,
    authContext: WorkspaceAuthContext,
  ): Promise<string> {
    const baseKey = buildProjectKeyFromName(name);
    const workspaceId = authContext.workspace.id;

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const projectRepository =
          await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            ProjectWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );

        let candidateKey = baseKey;
        let suffix = 2;

        // ponytail: a per-candidate exists() check races under concurrent
        // creation, but the DB's unique constraint on `key` is the real
        // safety net — a collision here just surfaces as a retryable error.
        while (
          await projectRepository.exists({ where: { key: candidateKey } })
        ) {
          candidateKey = `${baseKey}${suffix}`;
          suffix += 1;
        }

        return candidateKey;
      },
      authContext,
    );
  }
}
