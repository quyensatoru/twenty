import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';

// An issue reports itself to whoever filed it unless the payload says
// otherwise. Applied server-side so every creation path (Board, Backlog,
// record table, REST/GraphQL API) behaves the same.
//
// Must run AFTER assertRelationTargetAppScopeOrThrow: the implicit default
// should never be what turns an otherwise legitimate create into a
// permission error.
export const applyDefaultIssueReporter = (
  authContext: WorkspaceAuthContext,
  data: Partial<IssueWorkspaceEntity>,
): void => {
  if (authContext.type !== 'user' || isDefined(data.reporterId)) {
    return;
  }

  data.reporterId = authContext.workspaceMemberId;
};
