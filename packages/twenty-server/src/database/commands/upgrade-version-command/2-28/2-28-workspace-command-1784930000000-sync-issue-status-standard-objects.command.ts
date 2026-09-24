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
import { getStandardObjectSystemFieldUniversalIdentifiers } from 'src/database/commands/upgrade-version-command/utils/get-standard-object-system-field-universal-identifiers.util';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const ISSUE_STATUS_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueStatus.universalIdentifier,
];

// Applied through the legacy path, which injects nothing: the system fields
// and both sides of every relation pair are listed explicitly.
const ISSUE_STATUS_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  ...getStandardObjectSystemFieldUniversalIdentifiers(
    STANDARD_OBJECTS.issueStatus.fields,
  ),
  STANDARD_OBJECTS.issueStatus.fields.name.universalIdentifier,
  STANDARD_OBJECTS.issueStatus.fields.color.universalIdentifier,
  STANDARD_OBJECTS.issueStatus.fields.category.universalIdentifier,
  STANDARD_OBJECTS.issueStatus.fields.project.universalIdentifier,
  STANDARD_OBJECTS.project.fields.issueStatuses.universalIdentifier,
];

const ISSUE_STATUS_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueStatus.indexes.projectIdIndex.universalIdentifier,
];

const ISSUE_STATUS_VIEW_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueStatus.views.allIssueStatuses.universalIdentifier,
  STANDARD_OBJECTS.issueStatus.views.issueStatusRecordPageFields
    .universalIdentifier,
];

const ISSUE_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueStatus.views.allIssueStatuses.viewFields.name
    .universalIdentifier,
  STANDARD_OBJECTS.issueStatus.views.allIssueStatuses.viewFields.project
    .universalIdentifier,
  STANDARD_OBJECTS.issueStatus.views.allIssueStatuses.viewFields.createdAt
    .universalIdentifier,
];

@RegisteredWorkspaceCommand('2.28.0', 1784930000000)
@Command({
  name: 'upgrade:2-28:sync-issue-status-standard-objects',
  description:
    'Create the IssueStatus standard object (fields, index, views) and the Project.issueStatuses relation field in existing workspaces',
})
export class SyncIssueStatusStandardObjectsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatIndexMaps,
      flatViewMaps,
      flatViewFieldMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
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
          flatViewMaps,
          flatViewFieldMaps,
        },
        universalIdentifiersByMetadataName: {
          objectMetadata: ISSUE_STATUS_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
          fieldMetadata: ISSUE_STATUS_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          index: ISSUE_STATUS_INDEX_UNIVERSAL_IDENTIFIERS,
          view: ISSUE_STATUS_VIEW_UNIVERSAL_IDENTIFIERS,
          viewField: ISSUE_STATUS_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
        },
      });

    if (totalOperationCount === 0) {
      this.logger.log(
        `IssueStatus standard metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} IssueStatus standard metadata operations for workspace ${workspaceId}`,
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
        `Failed to create IssueStatus standard objects for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create IssueStatus standard objects for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} IssueStatus standard metadata operations for workspace ${workspaceId}`,
    );
  }
}
