import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { isFlatPageLayoutWidgetConfigurationOfType } from 'src/engine/metadata-modules/flat-page-layout-widget/utils/is-flat-page-layout-widget-configuration-of-type.util';
import { WidgetConfigurationType } from 'src/engine/metadata-modules/page-layout-widget/enums/widget-configuration-type.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const TASK_MANAGER_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issue.views.issueRecordPageFields.universalIdentifier,
  STANDARD_OBJECTS.project.views.projectRecordPageFields.universalIdentifier,
  STANDARD_OBJECTS.sprint.views.sprintRecordPageFields.universalIdentifier,
  STANDARD_OBJECTS.issueComment.views.issueCommentRecordPageFields
    .universalIdentifier,
  STANDARD_OBJECTS.worklog.views.worklogRecordPageFields.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.23.0', 1784650048100)
@Command({
  name: 'upgrade:2-23:backfill-task-manager-record-page-fields-views',
  description:
    'Create the missing Issue/Project/Sprint/IssueComment/Worklog Fields-widget views and rewire their existing Fields widgets to use them',
})
export class BackfillTaskManagerRecordPageFieldsViewsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { flatViewMaps, flatPageLayoutWidgetMaps, flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatViewMaps',
        'flatPageLayoutWidgetMaps',
        'flatObjectMetadataMaps',
      ]);

    const hasIssueObject = isDefined(
      findFlatEntityByUniversalIdentifier<FlatObjectMetadata>({
        flatEntityMaps: flatObjectMetadataMaps,
        universalIdentifier: STANDARD_OBJECTS.issue.universalIdentifier,
      }),
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

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const viewsToCreate =
      TASK_MANAGER_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIERS.flatMap(
        (universalIdentifier) => {
          if (
            isDefined(flatViewMaps.byUniversalIdentifier[universalIdentifier])
          ) {
            return [];
          }

          const standardView = findFlatEntityByUniversalIdentifier<FlatView>({
            flatEntityMaps: standardAllFlatEntityMaps.flatViewMaps,
            universalIdentifier,
          });

          if (!isDefined(standardView)) {
            throw new Error(
              `Could not find standard view ${universalIdentifier}`,
            );
          }

          return [standardView];
        },
      );

    const widgetsToUpdate = Object.values(
      flatPageLayoutWidgetMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .flatMap((widget) => {
        if (
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

        return [
          {
            ...widget,
            configuration: standardWidget.configuration,
            universalConfiguration: standardWidget.universalConfiguration,
          },
        ];
      });

    if (viewsToCreate.length === 0 && widgetsToUpdate.length === 0) {
      this.logger.log(
        `Task manager record page fields views already backfilled for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Creating ${viewsToCreate.length} view(s) and updating ${widgetsToUpdate.length} Fields widget(s) for workspace ${workspaceId}`,
    );

    if (isDryRun) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            view: {
              flatEntityToCreate: viewsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
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
        `Failed to backfill task manager record page fields views:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to backfill task manager record page fields views for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Backfilled task manager record page fields views for workspace ${workspaceId}`,
    );
  }
}
