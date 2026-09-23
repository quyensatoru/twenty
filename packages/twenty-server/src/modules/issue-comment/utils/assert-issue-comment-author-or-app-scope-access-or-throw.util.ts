import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { type AppScopeOperation } from 'src/engine/twenty-orm/types/app-scope-permission.type';
import { shouldBypassAppScope } from 'src/engine/twenty-orm/utils/should-bypass-app-scope.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type IssueCommentWorkspaceEntity } from 'src/modules/issue-comment/standard-objects/issue-comment.workspace-entity';

// Only the comment's author may edit/delete it, unless the acting role has
// been granted blanket app-scope access for the operation (the "admin" case).
export const assertIssueCommentAuthorOrAppScopeAccessOrThrow = async ({
  authContext,
  workspaceOrmManager,
  issueCommentId,
  operation,
}: {
  authContext: WorkspaceAuthContext;
  workspaceOrmManager: WorkspaceOrmManager;
  issueCommentId: string;
  operation: AppScopeOperation;
}): Promise<void> => {
  const workspace = authContext.workspace;

  assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

  await workspaceOrmManager.executeInWorkspaceContext(async () => {
    const context = getWorkspaceContext();

    const issueCommentRepository =
      workspaceOrmManager.getRepository<IssueCommentWorkspaceEntity>(
        'issueComment',
        { shouldBypassPermissionChecks: true },
      );

    const issueComment = await issueCommentRepository.findOne({
      where: { id: issueCommentId },
      select: ['id', 'authorId'],
    });

    const isAuthor =
      isDefined(issueComment) &&
      isDefined(issueComment.authorId) &&
      isUserAuthContext(authContext) &&
      issueComment.authorId === authContext.workspaceMemberId;

    if (isAuthor) {
      return;
    }

    if (
      shouldBypassAppScope({
        authContext,
        operation,
        allObjectRecordsRoleFlagsByRoleId:
          context.allObjectRecordsRoleFlagsByRoleId,
        userWorkspaceRoleMap: context.userWorkspaceRoleMap,
        apiKeyRoleMap: context.apiKeyRoleMap,
      })
    ) {
      return;
    }

    throw new PermissionsException(
      PermissionsExceptionMessage.PERMISSION_DENIED,
      PermissionsExceptionCode.PERMISSION_DENIED,
    );
  }, authContext);
};
