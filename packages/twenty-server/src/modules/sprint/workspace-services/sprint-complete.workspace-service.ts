import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { SprintWorkspaceEntity } from 'src/modules/sprint/standard-objects/sprint.workspace-entity';

@Injectable()
export class SprintCompleteWorkspaceService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async completeSprint(
    authContext: WorkspaceAuthContext,
    sprintId: string,
    targetSprintId: string | null,
  ): Promise<number> {
    const workspaceId = authContext.workspace.id;

    return this.globalWorkspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const sprintRepository =
          await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
            SprintWorkspaceEntity,
            { shouldBypassPermissionChecks: true },
          );
        const issueRepository =
          await this.globalWorkspaceOrmManager.getRepository(
            workspaceId,
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

        const { affected } = await issueRepository
          .createQueryBuilder()
          .update()
          .set({ sprintId: targetSprintId })
          .where('"sprintId" = :sprintId', { sprintId })
          .andWhere('"status" != :doneStatus', { doneStatus: 'DONE' })
          .execute();

        await sprintRepository.update(
          { id: sprintId },
          { state: 'CLOSED', completeDate: new Date().toISOString() },
        );

        return affected ?? 0;
      },
      authContext,
    );
  }
}
