import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

@Injectable()
@WorkspaceQueryHook(`issue.createOne`)
export class IssueCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<IssueWorkspaceEntity>,
  ): Promise<CreateOneResolverArgs<IssueWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    if (isDefined(payload.data.issueKey)) {
      return payload;
    }

    const projectId = payload.data.projectId;

    if (!isDefined(projectId)) {
      return payload;
    }

    const workspaceId = workspace.id;

    const { nextIssueNumber, key } =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const projectRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              workspaceId,
              ProjectWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

          // ponytail: atomic UPDATE...RETURNING is enough to prevent races;
          // a per-project Postgres sequence would only be needed if issue keys must never be reused after a rollback.
          const result = await projectRepository
            .createQueryBuilder()
            .update()
            .set({ nextIssueNumber: () => '"nextIssueNumber" + 1' })
            .where('id = :projectId', { projectId })
            .returning(['nextIssueNumber', 'key'])
            .execute();

          return result.raw[0] as {
            nextIssueNumber: number;
            key: string;
          };
        },
        authContext,
      );

    payload.data.issueKey = `${key}-${nextIssueNumber}`;

    return payload;
  }
}
