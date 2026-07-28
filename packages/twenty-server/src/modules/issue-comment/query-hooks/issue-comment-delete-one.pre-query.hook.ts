import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type DeleteOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertIssueCommentAuthorOrAppScopeAccessOrThrow } from 'src/modules/issue-comment/utils/assert-issue-comment-author-or-app-scope-access-or-throw.util';

@Injectable()
@WorkspaceQueryHook(`issueComment.deleteOne`)
export class IssueCommentDeleteOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DeleteOneResolverArgs,
  ): Promise<DeleteOneResolverArgs> {
    await assertIssueCommentAuthorOrAppScopeAccessOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      issueCommentId: payload.id,
      operation: 'softDelete',
    });

    return payload;
  }
}
