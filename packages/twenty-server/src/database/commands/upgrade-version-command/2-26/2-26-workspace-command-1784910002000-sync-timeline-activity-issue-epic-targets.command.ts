import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

// TimelineActivity.targetIssue/targetEpic and Issue.timelineActivities/
// Epic.timelineActivities were never created when Issue/Epic were introduced
// as standard objects, so Issue/Epic activity feeds stay empty forever.
const TIMELINE_ACTIVITY_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.timelineActivity.fields.targetIssue.universalIdentifier,
  STANDARD_OBJECTS.timelineActivity.fields.targetEpic.universalIdentifier,
  STANDARD_OBJECTS.issue.fields.timelineActivities.universalIdentifier,
  STANDARD_OBJECTS.epic.fields.timelineActivities.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.26.0', 1784910002000)
@Command({
  name: 'upgrade:2-26:sync-timeline-activity-issue-epic-targets',
  description:
    'Create the TimelineActivity.targetIssue/targetEpic morph-relation fields and the reciprocal Issue.timelineActivities/Epic.timelineActivities fields in existing workspaces',
})
export class SyncTimelineActivityIssueEpicTargetsCommand extends ProvisionedWorkspaceCommandRunner {
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
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

    const hasIssueObject = isDefined(
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issue.universalIdentifier
      ],
    );

    if (!hasIssueObject) {
      this.logger.log(
        `Task manager objects do not exist for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const now = new Date().toISOString();

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now,
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const flatFieldMetadataToCreate: (FlatFieldMetadata & {
      id?: string;
    })[] = TIMELINE_ACTIVITY_FIELD_METADATA_UNIVERSAL_IDENTIFIERS.flatMap(
      (universalIdentifier) => {
        if (
          isDefined(flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier])
        ) {
          return [];
        }

        const standardFieldMetadata =
          standardAllFlatEntityMaps.flatFieldMetadataMaps
            .byUniversalIdentifier[universalIdentifier];

        if (!isDefined(standardFieldMetadata)) {
          throw new Error(
            `Could not find standard field metadata ${universalIdentifier}`,
          );
        }

        return [standardFieldMetadata];
      },
    );

    if (flatFieldMetadataToCreate.length === 0) {
      this.logger.log(
        `TimelineActivity/Issue/Epic activity fields already exist for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would create ${flatFieldMetadataToCreate.length} TimelineActivity/Issue/Epic activity fields for workspace ${workspaceId}`,
      );

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: flatFieldMetadataToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      this.logger.error(
        `Failed to create TimelineActivity/Issue/Epic activity fields for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create TimelineActivity/Issue/Epic activity fields for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Created ${flatFieldMetadataToCreate.length} TimelineActivity/Issue/Epic activity fields for workspace ${workspaceId}`,
    );
  }
}
