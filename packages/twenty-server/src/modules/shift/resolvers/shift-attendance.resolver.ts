import { UseGuards } from '@nestjs/common';
import { Args, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { ShiftAttendanceWorkspaceService } from 'src/modules/shift/workspace-services/shift-attendance.workspace-service';

@CoreResolver()
@UseGuards(WorkspaceAuthGuard)
export class ShiftAttendanceResolver {
  constructor(
    private readonly shiftAttendanceWorkspaceService: ShiftAttendanceWorkspaceService,
  ) {}

  @Mutation(() => Boolean, { description: 'Check in to a registered shift.' })
  @UseGuards(NoPermissionGuard)
  async checkInShift(
    @Args('shiftId', { type: () => UUIDScalarType }) shiftId: string,
  ): Promise<boolean> {
    return this.shiftAttendanceWorkspaceService.checkIn(
      getWorkspaceAuthContext(),
      shiftId,
    );
  }

  @Mutation(() => Boolean, {
    description: 'Check out of a shift; computes payable minutes.',
  })
  @UseGuards(NoPermissionGuard)
  async checkOutShift(
    @Args('shiftId', { type: () => UUIDScalarType }) shiftId: string,
    @Args('handoverNote', { type: () => String, nullable: true })
    handoverNote: string | null,
  ): Promise<boolean> {
    return this.shiftAttendanceWorkspaceService.checkOut(
      getWorkspaceAuthContext(),
      shiftId,
      handoverNote ?? null,
    );
  }

  @Mutation(() => Boolean, {
    description: 'Cancel a registered shift with a reason and category.',
  })
  @UseGuards(NoPermissionGuard)
  async cancelShift(
    @Args('shiftId', { type: () => UUIDScalarType }) shiftId: string,
    @Args('reason', { type: () => String }) reason: string,
    @Args('category', { type: () => String }) category: string,
  ): Promise<boolean> {
    return this.shiftAttendanceWorkspaceService.cancel(
      getWorkspaceAuthContext(),
      shiftId,
      reason,
      category,
    );
  }
}
