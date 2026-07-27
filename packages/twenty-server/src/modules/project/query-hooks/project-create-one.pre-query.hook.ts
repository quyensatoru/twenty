import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

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

    return payload;
  }
}
