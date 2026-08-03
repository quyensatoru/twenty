import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { assertRelationTargetAppScopeOrThrow } from 'src/engine/twenty-orm/utils/assert-relation-target-app-scope-or-throw.util';
import { type EpicWorkspaceEntity } from 'src/modules/epic/standard-objects/epic.workspace-entity';

// `epic.projectId` is required (non-nullable) — a create always carries it.
// Epic had zero app-scope enforcement before this hook — this closes both
// gaps (actor write-access to the project, and assignee target validity) at
// once since a query-hooks module had to be created for Epic regardless.
@Injectable()
@WorkspaceQueryHook(`epic.createOne`)
export class EpicCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<EpicWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<EpicWorkspaceEntity>> {
    await assertAppScopeWriteAccessOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      objectNameSingular: 'epic',
      foreignKeyValue: payload.data.projectId,
    });

    await assertRelationTargetAppScopeOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      objectNameSingular: 'epic',
      projectId: payload.data.projectId,
      targets: isDefined(payload.data.assigneeId)
        ? [
            {
              fieldName: 'assigneeId',
              kind: 'workspaceMember',
              targetId: payload.data.assigneeId,
            },
          ]
        : [],
    });

    return payload;
  }
}
