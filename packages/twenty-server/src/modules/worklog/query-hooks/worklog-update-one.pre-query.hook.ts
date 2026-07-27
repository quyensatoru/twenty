import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { type WorklogWorkspaceEntity } from 'src/modules/worklog/standard-objects/worklog.workspace-entity';

// Only checked when `issueId` is being reassigned. This is a PRE hook
// (write-guard), distinct from the existing POST hook of the same key
// (time-tracking recomputation) — pre and post hooks are stored independently.
@Injectable()
@WorkspaceQueryHook(`worklog.updateOne`)
export class WorklogUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<WorklogWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<WorklogWorkspaceEntity>> {
    if (isDefined(payload.data.issueId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        objectNameSingular: 'worklog',
        foreignKeyValue: payload.data.issueId,
      });
    }

    return payload;
  }
}
