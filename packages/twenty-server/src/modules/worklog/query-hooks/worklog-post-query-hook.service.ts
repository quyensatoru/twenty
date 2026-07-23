import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';
import { WorklogWorkspaceEntity } from 'src/modules/worklog/standard-objects/worklog.workspace-entity';

@Injectable()
export class WorklogPostQueryHookService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
  ) {}

  async recomputeIssuesTimeTracking(
    authContext: WorkspaceAuthContext,
    worklogs: WorklogWorkspaceEntity[],
  ): Promise<void> {
    const issueIds = [
      ...new Set(worklogs.map((worklog) => worklog.issueId).filter(isDefined)),
    ];

    if (issueIds.length === 0) {
      return;
    }

    const workspaceId = authContext.workspace.id;

    await this.globalWorkspaceOrmManager.executeInWorkspaceContext(async () => {
      const worklogRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          WorklogWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );
      const issueRepository =
        await this.globalWorkspaceOrmManager.getRepository(
          workspaceId,
          IssueWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
        );

      for (const issueId of issueIds) {
        const rawResult = await worklogRepository
          .createQueryBuilder()
          .select('COALESCE(SUM("timeSpentMinutes"), 0)', 'total')
          .where('"issueId" = :issueId', { issueId })
          .getRawOne<{ total: string }>();

        const timeSpentMinutes = Number(rawResult?.total ?? 0);

        const issue = await issueRepository.findOne({
          where: { id: issueId },
        });

        if (!isDefined(issue)) {
          continue;
        }

        const remainingEstimateMinutes = isDefined(
          issue.originalEstimateMinutes,
        )
          ? Math.max(issue.originalEstimateMinutes - timeSpentMinutes, 0)
          : null;

        await issueRepository.update(
          { id: issueId },
          { timeSpentMinutes, remainingEstimateMinutes },
        );
      }
    }, authContext);
  }
}
