import { Command } from 'nest-commander';
import {
  STANDARD_OBJECTS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-shared/metadata';
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

const EPIC_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.epic.universalIdentifier,
];

// Applied through the legacy path, which injects nothing: the system fields
// and both sides of every relation pair are listed explicitly.
const EPIC_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  ...getStandardObjectSystemFieldUniversalIdentifiers(
    STANDARD_OBJECTS.epic.fields,
  ),
  STANDARD_OBJECTS.epic.fields.name.universalIdentifier,
  STANDARD_OBJECTS.epic.fields.project.universalIdentifier,
  STANDARD_OBJECTS.epic.fields.issues.universalIdentifier,
  STANDARD_OBJECTS.project.fields.epics.universalIdentifier,
  STANDARD_OBJECTS.issue.fields.epic.universalIdentifier,
];

const EPIC_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.epic.indexes.projectIdIndex.universalIdentifier,
  STANDARD_OBJECTS.issue.indexes.epicIdIndex.universalIdentifier,
];

const EPIC_VIEW_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.epic.views.allEpics.universalIdentifier,
  STANDARD_OBJECTS.epic.views.epicRecordPageFields.universalIdentifier,
];

const EPIC_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.epic.views.allEpics.viewFields.name.universalIdentifier,
  STANDARD_OBJECTS.epic.views.allEpics.viewFields.project.universalIdentifier,
  STANDARD_OBJECTS.epic.views.allEpics.viewFields.createdAt.universalIdentifier,
  STANDARD_OBJECTS.issue.views.allIssues.viewFields.epic.universalIdentifier,
];

const EPIC_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.universalIdentifier,
];

const EPIC_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.tabs.home
    .universalIdentifier,
];

const EPIC_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.epicRecordPage.tabs.home.widgets
    .fields.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.26.0', 1784910000000)
@Command({
  name: 'upgrade:2-26:sync-epic-standard-objects',
  description:
    'Create the Epic standard object (fields, index, views, page layout) and the Issue.epic/Project.epics relation fields in existing workspaces',
})
export class SyncEpicStandardObjectsCommand extends ProvisionedWorkspaceCommandRunner {
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
      flatPageLayoutMaps,
      flatPageLayoutTabMaps,
      flatPageLayoutWidgetMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
      'flatPageLayoutMaps',
      'flatPageLayoutTabMaps',
      'flatPageLayoutWidgetMaps',
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
          flatPageLayoutMaps,
          flatPageLayoutTabMaps,
          flatPageLayoutWidgetMaps,
        },
        universalIdentifiersByMetadataName: {
          objectMetadata: EPIC_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
          fieldMetadata: EPIC_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          index: EPIC_INDEX_UNIVERSAL_IDENTIFIERS,
          view: EPIC_VIEW_UNIVERSAL_IDENTIFIERS,
          viewField: EPIC_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
          pageLayout: EPIC_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
          pageLayoutTab: EPIC_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS,
          pageLayoutWidget: EPIC_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS,
        },
      });

    if (totalOperationCount === 0) {
      this.logger.log(
        `Epic standard metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} Epic standard metadata operations for workspace ${workspaceId}`,
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
        `Failed to create Epic standard objects for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create Epic standard objects for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} Epic standard metadata operations for workspace ${workspaceId}`,
    );
  }
}
