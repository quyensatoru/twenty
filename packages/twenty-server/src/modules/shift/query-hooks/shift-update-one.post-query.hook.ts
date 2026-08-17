import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ShiftRecomputeWorkspaceService } from 'src/modules/shift/query-hooks/shift-recompute.workspace-service';
import { type ShiftWorkspaceEntity } from 'src/modules/shift/standard-objects/shift.workspace-entity';

// The query-hook explorer normalizes the post-hook payload to the after-state
// records (an array) and never a field-level diff, so we cannot tell which
// columns the Leader/PO touched. recomputeAttendance is idempotent and skips
// no-op writes, so recomputing unconditionally on every shift.updateOne is safe
// and cheap. Ordinary members can never reach this path with punch edits — the
// pre-hook (Task 9) blocks them.
@Injectable()
@WorkspaceQueryHook({
  key: `shift.updateOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class ShiftUpdateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  private readonly logger = new Logger(ShiftUpdateOnePostQueryHook.name);

  constructor(
    private readonly shiftRecomputeWorkspaceService: ShiftRecomputeWorkspaceService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: ShiftWorkspaceEntity[],
  ): Promise<void> {
    const shiftIds = [
      ...new Set(payload.map((shift) => shift.id).filter(isDefined)),
    ];

    try {
      for (const shiftId of shiftIds) {
        await this.shiftRecomputeWorkspaceService.recomputeAttendance(
          authContext,
          shiftId,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to recompute shift attendance after updateOne',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
