import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorklogPostQueryHookService } from 'src/modules/worklog/query-hooks/worklog-post-query-hook.service';
import { type WorklogWorkspaceEntity } from 'src/modules/worklog/standard-objects/worklog.workspace-entity';

@Injectable()
@WorkspaceQueryHook({
  key: `worklog.deleteOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class WorklogDeleteOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly worklogPostQueryHookService: WorklogPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: WorklogWorkspaceEntity[],
  ): Promise<void> {
    await this.worklogPostQueryHookService.recomputeIssuesTimeTracking(
      authContext,
      payload,
    );
  }
}
