import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { buildSearchFieldMetadataBackfillOperations } from 'src/database/commands/upgrade-version-command/2-26/utils/build-search-field-metadata-backfill-operations.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { type UniversalUpdateFieldAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/field/types/workspace-migration-field-action';
import { WORKSPACE_MIGRATION_ACTION_TYPE } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/constants/workspace-migration-action-type.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { WorkspaceMigrationRunnerService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/services/workspace-migration-runner.service';

// Epic's SEARCH_FIELDS_BY_STANDARD_OBJECT_NAME entry was briefly empty (same
// class of bug already fixed once for Project/Sprint/IssueComment/Worklog in
// upgrade:2-23:backfill-task-manager-search-field-metadata): with no search
// fields, epic.searchVector is GENERATED ALWAYS AS (to_tsvector('simple', NULL))
// STORED, so every row's tsvector is NULL and the search resolver's
// `searchVector IS NOT NULL` filter makes epic always return zero results from
// the relation-picker/global search. Runs after sync-epic-standard-objects,
// which guarantees the epic object/fields already exist.
@RegisteredWorkspaceCommand('2.26.0', 1784910000500)
@Command({
  name: 'upgrade:2-26:backfill-epic-search-field-metadata',
  description:
    'Backfill the missing searchFieldMetadata row for epic.name and rebuild the epic.searchVector column so existing rows stop being NULL. Idempotent.',
})
export class BackfillEpicSearchFieldMetadataCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly workspaceMigrationRunnerService: WorkspaceMigrationRunnerService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;

    // Mirrors upgrade:2-23's own note: the migration runner only invalidates the
    // flat-maps keys a migration touched, so sync-epic-standard-objects can leave
    // these stale. The dedupe below compares live (objectMetadataId,
    // fieldMetadataId) pairs, so recompute first.
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatSearchFieldMetadataMaps',
    ]);

    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatSearchFieldMetadataMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatSearchFieldMetadataMaps',
    ]);

    const { twentyStandardFlatApplication, workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const { flatSearchFieldMetadatasToCreateByApplicationUniversalIdentifier } =
      buildSearchFieldMetadataBackfillOperations({
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
        flatSearchFieldMetadataMaps,
        standardFlatSearchFieldMetadataMaps:
          standardAllFlatEntityMaps.flatSearchFieldMetadataMaps,
        customApplicationId: workspaceCustomFlatApplication.id,
      });

    const applicationUniversalIdentifiers = Object.keys(
      flatSearchFieldMetadatasToCreateByApplicationUniversalIdentifier,
    );

    const flatSearchFieldMetadatasToCreate =
      applicationUniversalIdentifiers.flatMap(
        (applicationUniversalIdentifier) =>
          flatSearchFieldMetadatasToCreateByApplicationUniversalIdentifier[
            applicationUniversalIdentifier
          ] ?? [],
      );

    if (flatSearchFieldMetadatasToCreate.length === 0) {
      this.logger.log(
        `No missing searchFieldMetadata rows for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    const tsVectorFieldUniversalIdentifiersToRebuild = [
      ...new Set(
        flatSearchFieldMetadatasToCreate.map(
          (flatSearchFieldMetadata) =>
            flatSearchFieldMetadata.tsVectorFieldMetadataUniversalIdentifier,
        ),
      ),
    ];

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Found ${flatSearchFieldMetadatasToCreate.length} missing searchFieldMetadata row(s) for workspace ${workspaceId} across ${applicationUniversalIdentifiers.length} application(s); will rebuild ${tsVectorFieldUniversalIdentifiersToRebuild.length} search vector column(s)`,
    );

    if (isDryRun) {
      return;
    }

    for (const applicationUniversalIdentifier of applicationUniversalIdentifiers) {
      const flatSearchFieldMetadataToCreate =
        flatSearchFieldMetadatasToCreateByApplicationUniversalIdentifier[
          applicationUniversalIdentifier
        ];

      if (
        !isDefined(flatSearchFieldMetadataToCreate) ||
        flatSearchFieldMetadataToCreate.length === 0
      ) {
        continue;
      }

      const validateAndBuildResult =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
          {
            isSystemBuild: true,
            allFlatEntityOperationByMetadataName: {
              searchFieldMetadata: {
                flatEntityToCreate: flatSearchFieldMetadataToCreate,
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
            },
            workspaceId,
            applicationUniversalIdentifier,
          },
        );

      if (validateAndBuildResult.status === 'fail') {
        this.logger.error(
          `Failed to persist searchFieldMetadata rows for application ${applicationUniversalIdentifier}:\n${JSON.stringify(
            validateAndBuildResult,
            null,
            2,
          )}`,
        );

        throw new Error(
          `Failed to persist searchFieldMetadata rows for workspace ${workspaceId}`,
        );
      }
    }

    // Creating the rows above only fixes future provisioning/introspection. The
    // searchVector column already sitting in this workspace's schema is
    // GENERATED ALWAYS AS (to_tsvector('simple', NULL)) STORED (empty search
    // fields at creation time), so every existing row's tsvector is NULL. Only
    // dropping and re-adding the column (rebuildSearchVector) recomputes the
    // expression from the rows just created and repopulates existing rows.
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatSearchFieldMetadataMaps',
    ]);

    const rebuildActions: UniversalUpdateFieldAction[] =
      tsVectorFieldUniversalIdentifiersToRebuild.map((universalIdentifier) => ({
        type: WORKSPACE_MIGRATION_ACTION_TYPE.update,
        metadataName: 'fieldMetadata',
        universalIdentifier,
        update: { universalSettings: null },
        rebuildSearchVector: true,
      }));

    await this.workspaceMigrationRunnerService.run({
      workspaceMigration: {
        applicationUniversalIdentifier:
          twentyStandardFlatApplication.universalIdentifier,
        actions: rebuildActions,
      },
      workspaceId,
    });

    this.logger.log(
      `Successfully backfilled ${flatSearchFieldMetadatasToCreate.length} searchFieldMetadata row(s) and rebuilt ${tsVectorFieldUniversalIdentifiersToRebuild.length} search vector column(s) for workspace ${workspaceId}`,
    );
  }
}
