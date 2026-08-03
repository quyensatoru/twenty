import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ProjectPostQueryHookService } from 'src/modules/project/query-hooks/project-post-query-hook.service';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

@Injectable()
@WorkspaceQueryHook({
  key: `project.createOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class ProjectCreateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly projectPostQueryHookService: ProjectPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: ProjectWorkspaceEntity[],
  ): Promise<void> {
    const [project] = payload;

    if (!project) {
      return;
    }

    await this.projectPostQueryHookService.seedDefaultIssueStatuses(
      authContext,
      project,
    );
  }
}
