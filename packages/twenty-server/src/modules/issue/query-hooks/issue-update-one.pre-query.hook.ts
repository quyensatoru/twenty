import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { assertAppScopeWriteAccessOrThrow } from 'src/engine/twenty-orm/utils/assert-app-scope-write-access-or-throw.util';
import {
  type RelationTargetAppScopeEntry,
  assertRelationTargetAppScopeOrThrow,
} from 'src/engine/twenty-orm/utils/assert-relation-target-app-scope-or-throw.util';
import { IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

const hasIssueKey = (issueKey: string | null | undefined): boolean =>
  isDefined(issueKey) && issueKey.length > 0;

const buildIssueRelationTargetAppScopeEntries = (
  data: Partial<IssueWorkspaceEntity>,
): RelationTargetAppScopeEntry[] => {
  const entries: RelationTargetAppScopeEntry[] = [];

  if (isDefined(data.assigneeId)) {
    entries.push({
      fieldName: 'assigneeId',
      kind: 'workspaceMember',
      targetId: data.assigneeId,
    });
  }

  if (isDefined(data.reporterId)) {
    entries.push({
      fieldName: 'reporterId',
      kind: 'workspaceMember',
      targetId: data.reporterId,
    });
  }

  if (isDefined(data.merchantId)) {
    entries.push({
      fieldName: 'merchantId',
      kind: 'merchant',
      targetId: data.merchantId,
    });
  }

  return entries;
};

@Injectable()
@WorkspaceQueryHook(`issue.updateOne`)
export class IssueUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<IssueWorkspaceEntity>,
  ): Promise<UpdateOneResolverArgs<IssueWorkspaceEntity>> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    const workspaceId = workspace.id;
    const issueId = payload.id;
    const projectId = payload.data.projectId;

    if (isDefined(projectId)) {
      await assertAppScopeWriteAccessOrThrow({
        authContext,
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        objectNameSingular: 'issue',
        foreignKeyValue: projectId,
      });
    }

    const relationTargetAppScopeEntries =
      buildIssueRelationTargetAppScopeEntries(payload.data);

    if (relationTargetAppScopeEntries.length > 0) {
      // projectId isn't necessarily part of this update payload — fall back
      // to the record's current project so the guard still fires.
      const effectiveProjectId = isDefined(projectId)
        ? projectId
        : await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
            async () => {
              const issueRepository =
                await this.globalWorkspaceOrmManager.getRepository(
                  workspaceId,
                  IssueWorkspaceEntity,
                  { shouldBypassPermissionChecks: true },
                );

              const issue = await issueRepository.findOne({
                where: { id: issueId },
                select: ['id', 'projectId'],
              });

              return issue?.projectId ?? null;
            },
            authContext,
          );

      await assertRelationTargetAppScopeOrThrow({
        authContext,
        globalWorkspaceOrmManager: this.globalWorkspaceOrmManager,
        objectNameSingular: 'issue',
        projectId: effectiveProjectId,
        targets: relationTargetAppScopeEntries,
      });
    }

    if (!isDefined(projectId) || hasIssueKey(payload.data.issueKey)) {
      return payload;
    }

    const generatedIssueKey =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const issueRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              workspaceId,
              IssueWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

          const issue = await issueRepository.findOne({
            where: { id: issueId },
            select: ['id', 'issueKey'],
          });

          // Key is generated once, on the project assignment that first makes it possible.
          // issueKey reads back as '' (not null) for a never-set TEXT column, so an
          // isDefined check alone would treat every issue as already keyed.
          if (hasIssueKey(issue?.issueKey)) {
            return undefined;
          }

          const projectRepository =
            await this.globalWorkspaceOrmManager.getRepository(
              workspaceId,
              ProjectWorkspaceEntity,
              { shouldBypassPermissionChecks: true },
            );

          const result = await projectRepository
            .createQueryBuilder()
            .update()
            .set({ nextIssueNumber: () => '"nextIssueNumber" + 1' })
            .where('id = :projectId', { projectId })
            .returning(['nextIssueNumber', 'key'])
            .execute();

          const { nextIssueNumber, key } = result.raw[0] as {
            nextIssueNumber: number;
            key: string;
          };

          return `${key}-${nextIssueNumber}`;
        },
        authContext,
      );

    if (isDefined(generatedIssueKey)) {
      payload.data.issueKey = generatedIssueKey;
    }

    return payload;
  }
}
