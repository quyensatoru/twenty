import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { type IssueCommentWorkspaceEntity } from 'src/modules/issue-comment/standard-objects/issue-comment.workspace-entity';

// `issueComment.issueId` is required (non-nullable) — a create always carries
// it. Scoped via `issue -> project` (2 hops), resolved generically inside
// assertAppScopeWriteAccessOrThrow.
@Injectable()
@WorkspaceQueryHook(`issueComment.createOne`)
export class IssueCommentCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<IssueCommentWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<IssueCommentWorkspaceEntity>> {
    await assertAppScopeWriteAccessOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      objectNameSingular: 'issueComment',
      foreignKeyValue: payload.data.issueId,
    });

    return payload;
  }
}
