import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { EntityMetadataNotFoundError } from 'typeorm/error/EntityMetadataNotFoundError';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type EpicWorkspaceEntity } from 'src/modules/epic/standard-objects/epic.workspace-entity';
import { type IssueWorkspaceEntity } from 'src/modules/issue/standard-objects/issue.workspace-entity';

const ISSUE_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.issue.fields.issueType.universalIdentifier;

// Converts issue rows still using the legacy issueType='EPIC' value into real
// Epic records, repoints their children's parentId to the new epicId, then
// removes the now-unused 'EPIC' option from the issueType select field.
// Runs after (higher timestamp than) 2-26's sync-epic-standard-objects
// command, which guarantees the `epic` table already exists.
@RegisteredWorkspaceCommand('2.26.0', 1784910001000)
@Command({
  name: 'upgrade:2-26:backfill-epic-issue-data',
  description:
    'Convert legacy issueType=EPIC issue rows into Epic records and remove the EPIC option from issueType',
})
export class BackfillEpicIssueDataCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
    dataSource,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    if (!isDefined(dataSource)) {
      this.logger.log(
        `No workspace data source for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    let legacyEpicIssues: IssueWorkspaceEntity[];
    const issueRepository = dataSource.getRepository<IssueWorkspaceEntity>(
      'issue',
      { shouldBypassPermissionChecks: true },
    );

    try {
      legacyEpicIssues = await issueRepository.find({
        where: { issueType: 'EPIC' },
      });
    } catch (error) {
      if (error instanceof EntityMetadataNotFoundError) {
        this.logger.log(
          `issue object does not exist for workspace ${workspaceId}, skipping`,
        );

        return;
      }

      throw error;
    }

    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);

    const issueTypeFlatFieldMetadata =
      flatFieldMetadataMaps.byUniversalIdentifier[
        ISSUE_TYPE_FIELD_UNIVERSAL_IDENTIFIER
      ];

    const hasEpicOption =
      isDefined(issueTypeFlatFieldMetadata) &&
      (issueTypeFlatFieldMetadata.options ?? []).some(
        (option) => option.value === 'EPIC',
      );

    if (legacyEpicIssues.length === 0 && !hasEpicOption) {
      this.logger.log(
        `No legacy Epic issues or stale EPIC option for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would convert ${legacyEpicIssues.length} legacy Epic issue(s) into Epic record(s)${
          hasEpicOption
            ? ' and remove the stale EPIC option from issueType'
            : ''
        } for workspace ${workspaceId}`,
      );

      return;
    }

    if (legacyEpicIssues.length > 0) {
      const epicRepository = dataSource.getRepository<EpicWorkspaceEntity>(
        'epic',
        { shouldBypassPermissionChecks: true },
      );

      for (const legacyEpicIssue of legacyEpicIssues) {
        const epic = await epicRepository.save({
          name: legacyEpicIssue.title,
          projectId: legacyEpicIssue.projectId,
          createdBy: legacyEpicIssue.createdBy,
          updatedBy: legacyEpicIssue.updatedBy,
        });

        await issueRepository.update(
          { parentId: legacyEpicIssue.id },
          { epicId: epic.id, parentId: null },
        );
      }

      await issueRepository.delete(
        legacyEpicIssues.map((legacyEpicIssue) => legacyEpicIssue.id),
      );

      this.logger.log(
        `Converted ${legacyEpicIssues.length} legacy Epic issue(s) into Epic record(s) for workspace ${workspaceId}`,
      );
    }

    if (hasEpicOption && isDefined(issueTypeFlatFieldMetadata)) {
      const { twentyStandardFlatApplication } =
        await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
          { workspaceId },
        );

      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
          {
            workspaceId,
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
            allFlatEntityOperationByMetadataName: {
              fieldMetadata: {
                flatEntityToCreate: [],
                flatEntityToDelete: [],
                flatEntityToUpdate: [
                  {
                    ...issueTypeFlatFieldMetadata,
                    options: (issueTypeFlatFieldMetadata.options ?? []).filter(
                      (option) => option.value !== 'EPIC',
                    ),
                  },
                ],
              },
            },
          },
        );

      if (result.status === 'fail') {
        this.logger.error(
          `Failed to remove EPIC option from issueType for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
        );

        throw new Error(
          `Failed to remove EPIC option from issueType for workspace ${workspaceId}`,
        );
      }

      this.logger.log(
        `Removed stale EPIC option from issueType for workspace ${workspaceId}`,
      );
    }
  }
}
