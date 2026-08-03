import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type IssueStatusWorkspaceEntity } from 'src/modules/issue-status/standard-objects/issue-status.workspace-entity';
import { ProjectPostQueryHookService } from 'src/modules/project/query-hooks/project-post-query-hook.service';

@Injectable()
@WorkspaceQueryHook({
  key: `issueStatus.createOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class IssueStatusCreateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly projectPostQueryHookService: ProjectPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: IssueStatusWorkspaceEntity[],
  ): Promise<void> {
    await this.projectPostQueryHookService.syncViewGroupOnIssueStatusCreate(
      authContext,
      payload,
    );
  }
}
