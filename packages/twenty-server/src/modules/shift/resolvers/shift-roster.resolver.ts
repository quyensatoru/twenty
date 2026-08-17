import { UseGuards } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { ShiftRosterEntryDTO } from 'src/modules/shift/dtos/shift-roster-entry.dto';
import { ShiftRosterWorkspaceService } from 'src/modules/shift/workspace-services/shift-roster.workspace-service';

// Any authenticated workspace member may read the roster — coverage is
// team-visible by design and only safe fields are returned. The per-member read
// scope on the shift object is bypassed inside the service, not here.
@CoreResolver()
@UseGuards(WorkspaceAuthGuard)
export class ShiftRosterResolver {
  constructor(
    private readonly shiftRosterWorkspaceService: ShiftRosterWorkspaceService,
  ) {}

  @Query(() => [ShiftRosterEntryDTO], {
    description: 'Team shift roster (safe coverage fields) for a date range.',
  })
  @UseGuards(NoPermissionGuard)
  async shiftRoster(
    @Args('fromDate', { type: () => String }) fromDate: string,
    @Args('toDate', { type: () => String }) toDate: string,
  ): Promise<ShiftRosterEntryDTO[]> {
    return this.shiftRosterWorkspaceService.getRoster(
      getWorkspaceAuthContext(),
      fromDate,
      toDate,
    );
  }
}
