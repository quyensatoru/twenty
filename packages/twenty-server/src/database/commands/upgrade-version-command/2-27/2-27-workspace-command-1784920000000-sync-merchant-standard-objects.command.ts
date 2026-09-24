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

const MERCHANT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.merchant.universalIdentifier,
];

// Applied through the legacy path, which injects nothing: the system fields
// and both sides of every relation pair are listed explicitly.
const MERCHANT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  ...getStandardObjectSystemFieldUniversalIdentifiers(
    STANDARD_OBJECTS.merchant.fields,
  ),
  STANDARD_OBJECTS.merchant.fields.name.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.customSettings.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.app.universalIdentifier,
  STANDARD_OBJECTS.app.fields.merchants.universalIdentifier,
  STANDARD_OBJECTS.app.fields.fieldSchema.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.attachments.universalIdentifier,
  STANDARD_OBJECTS.attachment.fields.targetMerchant.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.noteTargets.universalIdentifier,
  STANDARD_OBJECTS.noteTarget.fields.targetMerchant.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.taskTargets.universalIdentifier,
  STANDARD_OBJECTS.taskTarget.fields.targetMerchant.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.timelineActivities.universalIdentifier,
  STANDARD_OBJECTS.timelineActivity.fields.targetMerchant.universalIdentifier,
];

const MERCHANT_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.merchant.indexes.appIdIndex.universalIdentifier,
];

const MERCHANT_VIEW_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.merchant.views.allMerchants.universalIdentifier,
  STANDARD_OBJECTS.merchant.views.merchantRecordPageFields.universalIdentifier,
];

const MERCHANT_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.merchant.views.allMerchants.viewFields.name
    .universalIdentifier,
  STANDARD_OBJECTS.merchant.views.allMerchants.viewFields.createdAt
    .universalIdentifier,
];

const MERCHANT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage
    .universalIdentifier,
];

const MERCHANT_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.home
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.timeline
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.tasks
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.notes
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.files
    .universalIdentifier,
];

const MERCHANT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.home
    .widgets.fields.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.timeline
    .widgets.timeline.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.tasks
    .widgets.tasks.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.notes
    .widgets.notes.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.merchantRecordPage.tabs.files
    .widgets.files.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.27.0', 1784920000000)
@Command({
  name: 'upgrade:2-27:sync-merchant-standard-objects',
  description:
    'Create the Merchant standard object (fields, index, views, page layout) and its attachments/notes/tasks/timeline relation fields in existing workspaces',
})
export class SyncMerchantStandardObjectsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const hasAppObject = isDefined(
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.app.universalIdentifier
      ],
    );

    if (!hasAppObject) {
      this.logger.log(
        `App object does not exist for workspace ${workspaceId}, skipping`,
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
          objectMetadata: MERCHANT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
          fieldMetadata: MERCHANT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          index: MERCHANT_INDEX_UNIVERSAL_IDENTIFIERS,
          view: MERCHANT_VIEW_UNIVERSAL_IDENTIFIERS,
          viewField: MERCHANT_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
          pageLayout: MERCHANT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
          pageLayoutTab: MERCHANT_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS,
          pageLayoutWidget: MERCHANT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS,
        },
      });

    if (totalOperationCount === 0) {
      this.logger.log(
        `Merchant standard metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} Merchant standard metadata operations for workspace ${workspaceId}`,
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
        `Failed to create Merchant standard objects for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create Merchant standard objects for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} Merchant standard metadata operations for workspace ${workspaceId}`,
    );
  }
}
