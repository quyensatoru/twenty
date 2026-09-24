import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import { assertRelationTargetAppScopeOrThrow } from 'src/engine/twenty-orm/utils/assert-relation-target-app-scope-or-throw.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { SprintWorkspaceEntity } from 'src/modules/sprint/standard-objects/sprint.workspace-entity';

// Only checked when `projectId` is being reassigned.
@Injectable()
@WorkspaceQueryHook(`sprint.updateOne`)
export class SprintUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<SprintWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<SprintWorkspaceEntity>> {
    const projectId = payload.data.projectId;

    if (isDefined(projectId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        workspaceOrmManager: this.workspaceOrmManager,
        objectNameSingular: 'sprint',
        foreignKeyValue: projectId,
      });
    }

    if (isDefined(payload.data.ownerId)) {
      // ownerId can be changed without projectId in the same payload — fall
      // back to the record's current project so the guard still fires.
      const effectiveProjectId = isDefined(projectId)
        ? projectId
        : await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
            const sprintRepository = this.workspaceOrmManager.getRepository(
              SprintWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

            const sprint = await sprintRepository.findOne({
              where: { id: payload.id },
              select: ['id', 'projectId'],
            });

            return sprint?.projectId ?? null;
          }, authContext);

      await assertRelationTargetAppScopeOrThrow({
        authContext,
        workspaceOrmManager: this.workspaceOrmManager,
        objectNameSingular: 'sprint',
        projectId: effectiveProjectId,
        targets: [
          {
            fieldName: 'ownerId',
            kind: 'workspaceMember',
            targetId: payload.data.ownerId,
          },
        ],
      });
    }

    return payload;
  }
}
