import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { SprintWorkspaceEntity } from 'src/modules/sprint/standard-objects/sprint.workspace-entity';

@Injectable()
export class SprintCompleteWorkspaceService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async completeSprint(
    authContext: WorkspaceAuthContext,
    sprintId: string,
    targetSprintId: string | null,
  ): Promise<number> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const sprintRepository = this.workspaceOrmManager.getRepository(
        SprintWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const issueRepository = this.workspaceOrmManager.getRepository(
        IssueWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );

      const sprint = await sprintRepository.findOne({
        where: { id: sprintId },
      });

      if (!isDefined(sprint)) {
        throw new UserInputError(`Sprint ${sprintId} not found`);
      }

      if (isDefined(targetSprintId)) {
        const targetSprint = await sprintRepository.findOne({
          where: { id: targetSprintId },
        });

        if (
          !isDefined(targetSprint) ||
          targetSprint.projectId !== sprint.projectId
        ) {
          throw new UserInputError(
            'Target sprint must belong to the same project',
          );
        }
      }

      const { generatedMaps } = await issueRepository
        .createQueryBuilder()
        .where('"sprintId" = :sprintId', { sprintId })
        .andWhere('"status" != :doneStatus', { doneStatus: 'DONE' })
        .update()
        .set({ sprintId: targetSprintId })
        .returning(['id'])
        .execute();

      await sprintRepository.update(
        { id: sprintId },
        { state: 'CLOSED', completeDate: new Date().toISOString() },
      );

      return generatedMaps.length;
    }, authContext);
  }
}
