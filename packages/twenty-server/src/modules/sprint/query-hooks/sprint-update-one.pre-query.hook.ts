import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { type SprintWorkspaceEntity } from 'src/modules/sprint/standard-objects/sprint.workspace-entity';

// Only checked when `projectId` is being reassigned.
@Injectable()
@WorkspaceQueryHook(`sprint.updateOne`)
export class SprintUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<SprintWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<SprintWorkspaceEntity>> {
    if (isDefined(payload.data.projectId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        objectNameSingular: 'sprint',
        foreignKeyValue: payload.data.projectId,
      });
    }

    return payload;
  }
}
