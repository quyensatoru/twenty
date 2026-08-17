import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { ShiftHandoverEntryDTO } from 'src/modules/shift/dtos/shift-handover-entry.dto';
import { ShiftHandoverWorkspaceService } from 'src/modules/shift/workspace-services/shift-handover.workspace-service';

// Any authenticated workspace member may read team handover notes — they are
// team-readable by design (BR-4.6). The per-member read scope on the shift object
// is bypassed inside the service, not here.
@CoreResolver()
@UseGuards(WorkspaceAuthGuard)
export class ShiftHandoverResolver {
  constructor(
    private readonly shiftHandoverWorkspaceService: ShiftHandoverWorkspaceService,
  ) {}

  @Query(() => [ShiftHandoverEntryDTO], {
    description:
      'Team shift handover notes (COMPLETED shifts with a note) for a date range.',
  })
  @UseGuards(NoPermissionGuard)
  async shiftHandovers(
    @Args('fromDate', { type: () => String }) fromDate: string,
    @Args('toDate', { type: () => String }) toDate: string,
  ): Promise<ShiftHandoverEntryDTO[]> {
    return this.shiftHandoverWorkspaceService.getHandovers(
      getWorkspaceAuthContext(),
      fromDate,
      toDate,
    );
  }
}
