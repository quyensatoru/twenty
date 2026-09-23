import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { type WorklogWorkspaceEntity } from 'src/modules/worklog/standard-objects/worklog.workspace-entity';

// `worklog.issueId` is required (non-nullable) — a create always carries it.
// Scoped via `issue -> project` (2 hops), resolved generically inside
// assertAppScopeWriteAccessOrThrow. This is a PRE hook (write-guard), distinct
// from the existing POST hooks in this module (time-tracking recomputation).
@Injectable()
@WorkspaceQueryHook(`worklog.createOne`)
export class WorklogCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<WorklogWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<WorklogWorkspaceEntity>> {
    await assertAppScopeWriteAccessOrThrow({
      authContext,
      workspaceOrmManager: this.workspaceOrmManager,
      objectNameSingular: 'worklog',
      foreignKeyValue: payload.data.issueId,
    });

    return payload;
  }
}
