import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { buildSearchFieldMetadataBackfillOperations } from 'src/database/commands/upgrade-version-command/2-23/utils/build-search-field-metadata-backfill-operations.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { type UniversalUpdateFieldAction } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/field/types/workspace-migration-field-action';
import { WORKSPACE_MIGRATION_ACTION_TYPE } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/constants/workspace-migration-action-type.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { WorkspaceMigrationRunnerService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/services/workspace-migration-runner.service';

// Project/Sprint/IssueComment/Worklog previously had an empty
// SEARCH_FIELDS_BY_STANDARD_OBJECT_NAME entry (unlike Issue), so
// getTsVectorColumnExpressionFromFields generated `to_tsvector('simple', NULL)`
// for their searchVector column, i.e. NULL on every row. The search resolver's
// empty-query path filters on `searchVector IS NOT NULL`, so these objects always
// returned zero results from the relation-picker/global search.
@RegisteredWorkspaceCommand('2.23.0', 1784650049000)
@Command({
  name: 'upgrade:2-23:backfill-task-manager-search-field-metadata',
  description:
    'Backfill missing searchFieldMetadata rows for Project/Sprint/IssueComment/Worklog now that they declare search fields, and rebuild their searchVector column (drop/re-add the generated column, same mechanism as upgrade:2-18:recompute-search-vectors) so existing rows stop being NULL. Idempotent.',
})
export class BackfillTaskManagerSearchFieldMetadataCommand extends ProvisionedWorkspaceCommandRunner {
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

    // Mirrors upgrade:2-16:backfill-search-field-metadata's own note: the migration
    // runner only invalidates the flat-maps keys a migration touched, so earlier
    // commands in the same upgrade chain can leave these stale. The dedupe below
    // compares live (objectMetadataId, fieldMetadataId) pairs, so recompute first.
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

    // The standard-application sync does not run during upgrades, so standard objects'
    // rows are backfilled from the same definition provisioning uses
    // (SEARCH_FIELDS_BY_STANDARD_OBJECT_NAME), not by parsing the searchVector asExpression.
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

    // Only the searchVector columns actually gaining a new search field need their
    // generated expression rebuilt; every other TS_VECTOR field is left untouched.
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

    // One migration per application: the runner assigns applicationId from the single
    // application passed here, keeping custom-object rows tied to the custom application.
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
    // GENERATED ALWAYS AS (to_tsvector('simple', NULL)) STORED (empty search fields at
    // creation time), so every existing row's tsvector is NULL. Only dropping and
    // re-adding the column (rebuildSearchVector) recomputes the expression from the
    // rows just created and repopulates existing rows — same mechanism as
    // upgrade:2-18:recompute-search-vectors, scoped to the columns that changed here.
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
        // Cross-app actions in general; here every target field belongs to the
        // standard application, same as the create step above.
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
