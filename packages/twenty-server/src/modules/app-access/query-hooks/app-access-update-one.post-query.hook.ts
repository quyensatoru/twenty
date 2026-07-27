import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
@WorkspaceQueryHook({
  key: `appAccess.updateOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class AppAccessUpdateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(private readonly workspaceCacheService: WorkspaceCacheService) {}

  async execute(authContext: WorkspaceAuthContext): Promise<void> {
    await this.workspaceCacheService.invalidateAndRecompute(
      authContext.workspace.id,
      ['appScopeGrants'],
    );
  }
}
