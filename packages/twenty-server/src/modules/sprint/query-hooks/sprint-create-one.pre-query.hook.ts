import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { assertRelationTargetAppScopeOrThrow } from 'src/engine/twenty-orm/utils/assert-relation-target-app-scope-or-throw.util';
import { type SprintWorkspaceEntity } from 'src/modules/sprint/standard-objects/sprint.workspace-entity';

// `sprint.projectId` is required (non-nullable) — a create always carries it.
@Injectable()
@WorkspaceQueryHook(`sprint.createOne`)
export class SprintCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<SprintWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<SprintWorkspaceEntity>> {
    await assertAppScopeWriteAccessOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      objectNameSingular: 'sprint',
      foreignKeyValue: payload.data.projectId,
    });

    await assertRelationTargetAppScopeOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      objectNameSingular: 'sprint',
      projectId: payload.data.projectId,
      targets: isDefined(payload.data.ownerId)
        ? [
            {
              fieldName: 'ownerId',
              kind: 'workspaceMember',
              targetId: payload.data.ownerId,
            },
          ]
        : [],
    });

    return payload;
  }
}
