import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import {
  type RelationTargetAppScopeEntry,
  assertRelationTargetAppScopeOrThrow,
} from 'src/engine/twenty-orm/utils/assert-relation-target-app-scope-or-throw.util';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

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
@WorkspaceQueryHook(`issue.createMany`)
export class IssueCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs<IssueWorkspaceEntity>,
  ): Promise<CreateManyResolverArgs<IssueWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    const distinctProjectIds = new Set(
      payload.data
        .map((issue) => issue.projectId)
        .filter((projectId): projectId is string => isDefined(projectId)),
    );

    await Promise.all(
      Array.from(distinctProjectIds, (projectId) =>
        assertAppScopeWriteAccessOrThrow({
          authContext,
          globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
          objectNameSingular: 'issue',
          foreignKeyValue: projectId,
        }),
      ),
    );

    await Promise.all(
      payload.data.map((issue) =>
        assertRelationTargetAppScopeOrThrow({
          authContext,
          globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
          objectNameSingular: 'issue',
          projectId: issue.projectId,
          targets: buildIssueRelationTargetAppScopeEntries(issue),
        }),
      ),
    );

    const issuesNeedingKeyByProjectId = new Map<
      string,
      IssueWorkspaceEntity[]
    >();

    for (const issue of payload.data) {
      if (isDefined(issue.issueKey) || !isDefined(issue.projectId)) {
        continue;
      }

      const issuesForProject =
        issuesNeedingKeyByProjectId.get(issue.projectId) ?? [];

      issuesForProject.push(issue);
      issuesNeedingKeyByProjectId.set(issue.projectId, issuesForProject);
    }

    if (issuesNeedingKeyByProjectId.size === 0) {
      return payload;
    }

    const workspaceId = workspace.id;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const projectRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          ProjectWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      for (const [projectId, issues] of issuesNeedingKeyByProjectId) {
        const result = await projectRepository
          .createQueryBuilder()
          .update()
          .set({
            nextIssueNumber: () => `"nextIssueNumber" + ${issues.length}`,
          })
          .where('id = :projectId', { projectId })
          .returning(['nextIssueNumber', 'key'])
          .execute();

        const { nextIssueNumber: lastIssueNumber, key } = result.raw[0] as {
          nextIssueNumber: number;
          key: string;
        };

        const firstIssueNumber = lastIssueNumber - issues.length + 1;

        issues.forEach((issue, index) => {
          issue.issueKey = `${key}-${firstIssueNumber + index}`;
        });
      }
    }, authContext);

    return payload;
  }
}
