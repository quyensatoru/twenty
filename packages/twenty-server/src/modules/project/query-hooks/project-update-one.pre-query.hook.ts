import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

// Only checked when `appId` is actually part of the update payload (i.e. being
// reassigned) — leaving a project's app untouched never needs re-validating.
@Injectable()
@WorkspaceQueryHook(`project.updateOne`)
export class ProjectUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<ProjectWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<ProjectWorkspaceEntity>> {
    if (isDefined(payload.data.appId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        workspaceOrmManager: this.workspaceOrmManager,
        objectNameSingular: 'project',
        foreignKeyValue: payload.data.appId,
      });
    }

    return payload;
  }
}
