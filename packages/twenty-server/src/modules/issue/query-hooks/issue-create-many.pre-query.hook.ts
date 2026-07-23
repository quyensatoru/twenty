import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

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
