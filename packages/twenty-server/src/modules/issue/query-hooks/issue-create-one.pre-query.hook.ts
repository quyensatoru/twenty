import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import {
  type RelationTargetAppScopeEntry,
  assertRelationTargetAppScopeOrThrow,
} from 'src/engine/twenty-orm/utils/assert-relation-target-app-scope-or-throw.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { reserveProjectIssueNumbers } from 'src/modules/issue/utils/reserve-project-issue-numbers.util';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { applyDefaultIssueReporter } from 'src/modules/issue/utils/apply-default-issue-reporter.util';

const buildIssueRelationTargetAppScopeEntries = (
  data: Partial<IssueWorkspaceEntity>,
): RelationTargetAppScopeEntry[] => {
  const entries: RelationTargetAppScopeEntry[] = [];

  if (isDefined(data.assigneeId)) {
    entries.push({
      fieldName: 'assigneeId',
      kind: 'workspaceMember',
      targetId: data.assigneeId,
    });
  }

  if (isDefined(data.reporterId)) {
    entries.push({
      fieldName: 'reporterId',
      kind: 'workspaceMember',
      targetId: data.reporterId,
    });
  }

  if (isDefined(data.merchantId)) {
    entries.push({
      fieldName: 'merchantId',
      kind: 'merchant',
      targetId: data.merchantId,
    });
  }

  return entries;
};

@Injectable()
@WorkspaceQueryHook(`issue.createOne`)
export class IssueCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<IssueWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<IssueWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    const projectId = payload.data.projectId;

    await assertAppScopeWriteAccessOrThrow({
      authContext,
      workspaceOrmManager: this.workspaceOrmManager,
      objectNameSingular: 'issue',
      foreignKeyValue: projectId,
    });

    await assertRelationTargetAppScopeOrThrow({
      authContext,
      workspaceOrmManager: this.workspaceOrmManager,
      objectNameSingular: 'issue',
      projectId,
      targets: buildIssueRelationTargetAppScopeEntries(payload.data),
    });

    applyDefaultIssueReporter(authContext, payload.data);

    if (isDefined(payload.data.issueKey)) {
      return payload;
    }

    if (!isDefined(projectId)) {
      return payload;
    }

    const reservation =
      await this.workspaceOrmManager.executeInWorkspaceContext(
        () =>
          reserveProjectIssueNumbers({
            workspaceOrmManager: this.workspaceOrmManager,
            workspaceId: workspace.id,
            projectId,
            count: 1,
          }),
        authContext,
      );

    if (isDefined(reservation)) {
      payload.data.issueKey = `${reservation.key}-${reservation.firstIssueNumber}`;
    }

    return payload;
  }
}
