import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { computeTwentyStandardApplicationAllFlatEntityMapsPre231 } from 'src/database/commands/upgrade-version-command/2-10/utils/compute-twenty-standard-application-all-flat-entity-maps-pre-2-31.util';
import { FORK_PRE_2_31_RECORD_PAGE_UNIVERSAL_IDENTIFIER_BY_DERIVED } from 'src/database/commands/upgrade-version-command/2-31/constants/fork-pre-2-31-record-page-universal-identifiers.constant';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { isFlatPageLayoutWidgetConfigurationOfType } from 'src/engine/metadata-modules/flat-page-layout-widget/utils/is-flat-page-layout-widget-configuration-of-type.util';
import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const FORK_PRE_2_31_RECORD_PAGE_UNIVERSAL_IDENTIFIERS = new Set(
  Object.values(FORK_PRE_2_31_RECORD_PAGE_UNIVERSAL_IDENTIFIER_BY_DERIVED),
);

// Runs right before upgrade:2-31:reconcile-standard-record-page, which walks a
// record-page stack through its FIELDS widget's viewId: a fork widget that was
// created with a null viewId (epic, shift, shiftTemplate, specialDay were
// missing from the standard fields-view mapping) would be skipped there and
// then duplicated by the backfill.
@RegisteredWorkspaceCommand('2.31.0', 1786437480900)
@Command({
  name: 'upgrade:2-31:link-fork-record-page-fields-widget-views',
  description:
    'Point the Fields widgets of the fork record pages (task manager, merchant, shift) that have no view at their standard Fields-widget view, so the 2-31 record-page reconcile re-owns their stack instead of the backfill duplicating it',
})
export class LinkForkRecordPageFieldsWidgetViewsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { flatPageLayoutWidgetMaps, flatViewMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatPageLayoutWidgetMaps',
        'flatViewMaps',
      ]);

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

    const widgetsToUpdate = Object.values(
      flatPageLayoutWidgetMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .flatMap((widget) => {
        if (
          !FORK_PRE_2_31_RECORD_PAGE_UNIVERSAL_IDENTIFIERS.has(
            widget.universalIdentifier,
          ) ||
          isDefined(widget.deletedAt) ||
          !isFlatPageLayoutWidgetConfigurationOfType(
            widget,
            WidgetConfigurationType.FIELDS,
          ) ||
          isDefined(widget.configuration.viewId)
        ) {
          return [];
        }

        const standardWidget =
          findFlatEntityByUniversalIdentifier<FlatPageLayoutWidget>({
            flatEntityMaps: standardAllFlatEntityMaps.flatPageLayoutWidgetMaps,
            universalIdentifier: widget.universalIdentifier,
          });

        if (
          !isDefined(standardWidget) ||
          !isFlatPageLayoutWidgetConfigurationOfType(
            standardWidget,
            WidgetConfigurationType.FIELDS,
          ) ||
          !isDefined(standardWidget.configuration.viewId)
        ) {
          return [];
        }

        const standardViewUniversalIdentifier = Object.values(
          standardAllFlatEntityMaps.flatViewMaps.byUniversalIdentifier,
        ).find((flatView) => flatView?.id === standardWidget.configuration.viewId)
          ?.universalIdentifier;

        const existingView = isDefined(standardViewUniversalIdentifier)
          ? flatViewMaps.byUniversalIdentifier[standardViewUniversalIdentifier]
          : undefined;

        if (!isDefined(existingView) || isDefined(existingView.deletedAt)) {
          return [];
        }

        return [
          {
            ...widget,
            configuration: {
              ...widget.configuration,
              viewId: existingView.id,
            },
            universalConfiguration: standardWidget.universalConfiguration,
          },
        ];
      });

    if (widgetsToUpdate.length === 0) {
      this.logger.log(
        `No fork Fields widget to link for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Linking ${widgetsToUpdate.length} fork Fields widget(s) to their view for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            pageLayoutWidget: {
              flatEntityToCreate: [],
              flatEntityToDelete: [],
              flatEntityToUpdate: widgetsToUpdate,
            },
          },
        },
      );

    if (result.status === 'fail') {
      this.logger.error(
        `Failed to link fork Fields widgets for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to link fork Fields widgets for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Linked ${widgetsToUpdate.length} fork Fields widget(s) for workspace ${workspaceId}`,
    );
  }
}
