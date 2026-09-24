import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMapsPre231 } from 'src/database/commands/upgrade-version-command/2-10/utils/compute-twenty-standard-application-all-flat-entity-maps-pre-2-31.util';
import { buildForkStandardSyncOperations } from 'src/database/commands/upgrade-version-command/utils/build-fork-standard-sync-operations.util';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

// New fields only, no backfill needed — they're nullable and start empty on
// every existing Issue/Epic/Sprint record. Both sides of every relation pair
// are listed explicitly since the engine does not auto-generate the reverse
// side.
const APP_SCOPE_RELATION_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.epic.fields.assignee.universalIdentifier,
  STANDARD_OBJECTS.workspaceMember.fields.assignedEpics.universalIdentifier,
  STANDARD_OBJECTS.sprint.fields.owner.universalIdentifier,
  STANDARD_OBJECTS.workspaceMember.fields.ownedSprints.universalIdentifier,
];

const APP_SCOPE_RELATION_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.epic.indexes.assigneeIdIndex.universalIdentifier,
  STANDARD_OBJECTS.sprint.indexes.ownerIdIndex.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.28.0', 1784930002000)
@Command({
  name: 'upgrade:2-28:sync-issue-epic-sprint-app-scope-relations',
  description:
    'Create the Epic.assignee and Sprint.owner relation fields (and their WorkspaceMember reverse sides) in existing workspaces',
})
export class SyncIssueEpicSprintAppScopeRelationsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatIndexMaps',
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

    const standardAllFlatEntityMaps =
      computeTwentyStandardApplicationAllFlatEntityMapsPre231({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const { allFlatEntityOperationByMetadataName, totalOperationCount } =
      buildForkStandardSyncOperations({
        standardAllFlatEntityMaps,
        existingAllFlatEntityMaps: {
          flatObjectMetadataMaps,
          flatFieldMetadataMaps,
          flatIndexMaps,
        },
        universalIdentifiersByMetadataName: {
          fieldMetadata: APP_SCOPE_RELATION_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          index: APP_SCOPE_RELATION_INDEX_UNIVERSAL_IDENTIFIERS,
        },
      });

    if (totalOperationCount === 0) {
      this.logger.log(
        `Issue/Epic/Sprint app-scope relation fields already exist for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} Issue/Epic/Sprint app-scope relation field operations for workspace ${workspaceId}`,
      );

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName,
        },
      );

    if (result.status === 'fail') {
      this.logger.error(
        `Failed to create Issue/Epic/Sprint app-scope relation fields for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create Issue/Epic/Sprint app-scope relation fields for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} Issue/Epic/Sprint app-scope relation field operations for workspace ${workspaceId}`,
    );
  }
}
