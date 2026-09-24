import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { buildForkStandardSyncOperations } from 'src/database/commands/upgrade-version-command/utils/build-fork-standard-sync-operations.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_NAVIGATION_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-navigation-menu-item.constant';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

// The fork's Task Manager link used to share its universal identifier with the
// upstream Campaigns item, so upgrade:2-25:remove-message-campaign-navigation-menu-item
// deleted it. Each item is only restored once the object it points at exists.
const FORK_NAVIGATION_MENU_ITEMS_BY_REQUIRED_OBJECT_UNIVERSAL_IDENTIFIER = [
  {
    navigationMenuItemUniversalIdentifier:
      STANDARD_NAVIGATION_MENU_ITEMS.taskManager.universalIdentifier,
    requiredObjectUniversalIdentifier: STANDARD_OBJECTS.issue.universalIdentifier,
  },
  {
    navigationMenuItemUniversalIdentifier:
      STANDARD_NAVIGATION_MENU_ITEMS.allIssues.universalIdentifier,
    requiredObjectUniversalIdentifier: STANDARD_OBJECTS.issue.universalIdentifier,
  },
  {
    navigationMenuItemUniversalIdentifier:
      STANDARD_NAVIGATION_MENU_ITEMS.shiftTracker.universalIdentifier,
    requiredObjectUniversalIdentifier: STANDARD_OBJECTS.shift.universalIdentifier,
  },
  {
    navigationMenuItemUniversalIdentifier:
      STANDARD_NAVIGATION_MENU_ITEMS.allShiftTemplates.universalIdentifier,
    requiredObjectUniversalIdentifier:
      STANDARD_OBJECTS.shiftTemplate.universalIdentifier,
  },
  {
    navigationMenuItemUniversalIdentifier:
      STANDARD_NAVIGATION_MENU_ITEMS.allSpecialDays.universalIdentifier,
    requiredObjectUniversalIdentifier:
      STANDARD_OBJECTS.specialDay.universalIdentifier,
  },
];

@RegisteredWorkspaceCommand('2.42.0', 1790216465319)
@Command({
  name: 'upgrade:2-42:restore-fork-navigation-menu-items',
  description:
    'Recreate the fork navigation menu items (Task Manager, Issues, Shifts, Shift Templates, Special Days) missing from existing workspaces',
})
export class RestoreForkNavigationMenuItemsCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { flatObjectMetadataMaps, flatNavigationMenuItemMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatNavigationMenuItemMaps',
      ]);

    const navigationMenuItemUniversalIdentifiers =
      FORK_NAVIGATION_MENU_ITEMS_BY_REQUIRED_OBJECT_UNIVERSAL_IDENTIFIER.filter(
        ({ requiredObjectUniversalIdentifier }) =>
          isDefined(
            flatObjectMetadataMaps.byUniversalIdentifier[
              requiredObjectUniversalIdentifier
            ],
          ),
      ).map(
        ({ navigationMenuItemUniversalIdentifier }) =>
          navigationMenuItemUniversalIdentifier,
      );

    if (navigationMenuItemUniversalIdentifiers.length === 0) {
      this.logger.log(
        `No fork object exists for workspace ${workspaceId}, skipping`,
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

    const { allFlatEntityOperationByMetadataName, totalOperationCount } =
      buildForkStandardSyncOperations({
        standardAllFlatEntityMaps,
        existingAllFlatEntityMaps: { flatNavigationMenuItemMaps },
        universalIdentifiersByMetadataName: {
          navigationMenuItem: navigationMenuItemUniversalIdentifiers,
        },
      });

    if (totalOperationCount === 0) {
      this.logger.log(
        `Fork navigation menu items already exist for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    this.logger.log(
      `${isDryRun ? '[DRY RUN] ' : ''}Restoring ${totalOperationCount} fork navigation menu item(s) for workspace ${workspaceId}`,
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
          allFlatEntityOperationByMetadataName,
        },
      );

    if (result.status === 'fail') {
      this.logger.error(
        `Failed to restore fork navigation menu items for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to restore fork navigation menu items for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Restored ${totalOperationCount} fork navigation menu item(s) for workspace ${workspaceId}`,
    );
  }
}
