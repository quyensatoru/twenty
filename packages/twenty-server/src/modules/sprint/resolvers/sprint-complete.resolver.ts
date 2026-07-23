import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { SprintCompleteWorkspaceService } from 'src/modules/sprint/workspace-services/sprint-complete.workspace-service';

@CoreResolver()
@UseGuards(WorkspaceAuthGuard)
export class SprintCompleteResolver {
  constructor(
    private readonly sprintCompleteWorkspaceService: SprintCompleteWorkspaceService,
  ) {}

  @Mutation(() => Int, {
    description:
      'Close a sprint and move its unfinished issues to the backlog or to another sprint.',
  })
  @UseGuards(NoPermissionGuard)
  async completeSprint(
    @Args('sprintId', { type: () => UUIDScalarType }) sprintId: string,
    @Args('targetSprintId', { type: () => UUIDScalarType, nullable: true })
    targetSprintId: string | null,
  ): Promise<number> {
    const authContext = getWorkspaceAuthContext();

    return this.sprintCompleteWorkspaceService.completeSprint(
      authContext,
      sprintId,
      targetSprintId ?? null,
    );
  }
}
