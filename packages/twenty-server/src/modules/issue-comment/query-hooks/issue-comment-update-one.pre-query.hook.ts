import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { assertIssueCommentAuthorOrAppScopeAccessOrThrow } from 'src/modules/issue-comment/utils/assert-issue-comment-author-or-app-scope-access-or-throw.util';
import { type IssueCommentWorkspaceEntity } from 'src/modules/issue-comment/standard-objects/issue-comment.workspace-entity';

// `issueId` reassignment is app-scope gated; editing the comment itself is
// restricted to its author (or a role with blanket write access).
@Injectable()
@WorkspaceQueryHook(`issueComment.updateOne`)
export class IssueCommentUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<IssueCommentWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<IssueCommentWorkspaceEntity>> {
    if (isDefined(payload.data.issueId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        objectNameSingular: 'issueComment',
        foreignKeyValue: payload.data.issueId,
      });
    }

    await assertIssueCommentAuthorOrAppScopeAccessOrThrow({
      authContext,
      globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
      issueCommentId: payload.id,
      operation: 'write',
    });

    return payload;
  }
}
