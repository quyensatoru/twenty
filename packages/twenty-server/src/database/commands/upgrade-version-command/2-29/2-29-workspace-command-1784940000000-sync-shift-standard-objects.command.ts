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
import { STANDARD_NAVIGATION_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-navigation-menu-item.constant';
import { computeTwentyStandardApplicationAllFlatEntityMapsPre231 } from 'src/database/commands/upgrade-version-command/2-10/utils/compute-twenty-standard-application-all-flat-entity-maps-pre-2-31.util';
import { buildForkStandardSyncOperations } from 'src/database/commands/upgrade-version-command/utils/build-fork-standard-sync-operations.util';
import { getStandardObjectSystemFieldUniversalIdentifiers } from 'src/database/commands/upgrade-version-command/utils/get-standard-object-system-field-universal-identifiers.util';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

// NOTE (go-live): this migration provisions METADATA only (objects, fields,
// indexes, views, page layouts, nav items). Two per-workspace go-live steps are
// DATA and are NOT handled here — each must be recreated by hand on a fresh
// prod/staging workspace:
//   1. The Record Visibility Policy on `shift` (member read-scoping RVP +
//      the restricted "CS Member" role) — see plans.md (Task 9 §self-check).
//   2. The two Mattermost workflows (punch → Mattermost, Sunday reminder) —
//      see mattermost-workflows.md / plans.md Task 16.

const SHIFT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.shiftTemplate.universalIdentifier,
  STANDARD_OBJECTS.specialDay.universalIdentifier,
  STANDARD_OBJECTS.shift.universalIdentifier,
];

// Applied through the legacy path, which injects nothing: the system fields
// and both sides of every relation pair are listed explicitly.
const SHIFT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  ...getStandardObjectSystemFieldUniversalIdentifiers(
    STANDARD_OBJECTS.shiftTemplate.fields,
  ),
  ...getStandardObjectSystemFieldUniversalIdentifiers(
    STANDARD_OBJECTS.specialDay.fields,
  ),
  ...getStandardObjectSystemFieldUniversalIdentifiers(
    STANDARD_OBJECTS.shift.fields,
  ),
  // shiftTemplate business fields
  STANDARD_OBJECTS.shiftTemplate.fields.name.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.code.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.startTime.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.endTime.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.dayKind.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.earlyCheckInMinutes.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.lateCheckOutMinutes.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.salaryPerHour.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.color.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.isActive.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.description.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.fields.shifts.universalIdentifier,
  // specialDay business fields
  STANDARD_OBJECTS.specialDay.fields.name.universalIdentifier,
  STANDARD_OBJECTS.specialDay.fields.kind.universalIdentifier,
  STANDARD_OBJECTS.specialDay.fields.month.universalIdentifier,
  STANDARD_OBJECTS.specialDay.fields.day.universalIdentifier,
  STANDARD_OBJECTS.specialDay.fields.date.universalIdentifier,
  STANDARD_OBJECTS.specialDay.fields.multiplier.universalIdentifier,
  STANDARD_OBJECTS.specialDay.fields.isActive.universalIdentifier,
  // shift business fields
  STANDARD_OBJECTS.shift.fields.name.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.date.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.status.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.templateCode.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.templateName.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.startTime.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.endTime.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.checkInAt.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.checkOutAt.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.checkInLateMinutes.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.workingMinutes.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.rateMultiplier.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.handoverNote.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.cancelReason.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.cancelCategory.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.cancelledAt.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.member.universalIdentifier,
  STANDARD_OBJECTS.shift.fields.shiftTemplate.universalIdentifier,
  // Inverse relation side on the pre-existing workspaceMember object
  STANDARD_OBJECTS.workspaceMember.fields.shifts.universalIdentifier,
];

const SHIFT_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.shiftTemplate.indexes.isActiveIndex.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.indexes.codeIndex.universalIdentifier,
  STANDARD_OBJECTS.specialDay.indexes.kindIsActiveIndex.universalIdentifier,
  STANDARD_OBJECTS.shift.indexes.memberIdIndex.universalIdentifier,
  STANDARD_OBJECTS.shift.indexes.shiftTemplateIdIndex.universalIdentifier,
  STANDARD_OBJECTS.shift.indexes.dateIndex.universalIdentifier,
];

const SHIFT_VIEW_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.views.shiftTemplateRecordPageFields
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.specialDayRecordPageFields
    .universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.universalIdentifier,
  STANDARD_OBJECTS.shift.views.shiftRecordPageFields.universalIdentifier,
];

// The *RecordPageFields views intentionally carry no view fields (the record
// page renders fields through the page-layout widget), so only the list views
// contribute view fields here.
const SHIFT_VIEW_FIELD_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.viewFields.name
    .universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.viewFields.code
    .universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.viewFields.startTime
    .universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.viewFields.endTime
    .universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.viewFields.dayKind
    .universalIdentifier,
  STANDARD_OBJECTS.shiftTemplate.views.allShiftTemplates.viewFields.isActive
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.name
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.kind
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.month
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.day
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.date
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.multiplier
    .universalIdentifier,
  STANDARD_OBJECTS.specialDay.views.allSpecialDays.viewFields.isActive
    .universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.name.universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.date.universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.status.universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.member.universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.templateCode
    .universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.checkInAt
    .universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.checkOutAt
    .universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.checkInLateMinutes
    .universalIdentifier,
  STANDARD_OBJECTS.shift.views.allShifts.viewFields.workingMinutes
    .universalIdentifier,
];

const SHIFT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftTemplateRecordPage
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.specialDayRecordPage
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftRecordPage
    .universalIdentifier,
];

const SHIFT_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftTemplateRecordPage.tabs.home
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.specialDayRecordPage.tabs.home
    .universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftRecordPage.tabs.home
    .universalIdentifier,
];

const SHIFT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS = [
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftTemplateRecordPage.tabs.home
    .widgets.fields.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.specialDayRecordPage.tabs.home
    .widgets.fields.universalIdentifier,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.shiftRecordPage.tabs.home.widgets
    .fields.universalIdentifier,
];

const SHIFT_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIERS = [
  STANDARD_NAVIGATION_MENU_ITEMS.shiftTracker.universalIdentifier,
  STANDARD_NAVIGATION_MENU_ITEMS.allShiftTemplates.universalIdentifier,
  STANDARD_NAVIGATION_MENU_ITEMS.allSpecialDays.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.29.0', 1784940000000)
@Command({
  name: 'upgrade:2-29:sync-shift-standard-objects',
  description:
    'Create the shiftTemplate/specialDay/shift standard objects (fields, indexes, views, page layouts, navigation items) and the WorkspaceMember.shifts inverse relation in existing workspaces. Note: the shift Record Visibility Policy / CS Member role and the two Mattermost workflows are separate per-workspace go-live data steps NOT handled by this migration.',
})
export class SyncShiftStandardObjectsCommand extends ProvisionedWorkspaceCommandRunner {
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
      flatNavigationMenuItemMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
      'flatPageLayoutMaps',
      'flatPageLayoutTabMaps',
      'flatPageLayoutWidgetMaps',
      'flatNavigationMenuItemMaps',
    ]);

    // shift.member relates to workspaceMember; guard on its presence since the
    // inverse relation (workspaceMember.shifts) is created against it.
    const hasWorkspaceMemberObject = isDefined(
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.workspaceMember.universalIdentifier
      ],
    );

    if (!hasWorkspaceMemberObject) {
      this.logger.log(
        `WorkspaceMember object does not exist for workspace ${workspaceId}, skipping`,
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
          flatNavigationMenuItemMaps,
        },
        universalIdentifiersByMetadataName: {
          objectMetadata: SHIFT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
          fieldMetadata: SHIFT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          index: SHIFT_INDEX_UNIVERSAL_IDENTIFIERS,
          view: SHIFT_VIEW_UNIVERSAL_IDENTIFIERS,
          viewField: SHIFT_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
          pageLayout: SHIFT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
          pageLayoutTab: SHIFT_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS,
          pageLayoutWidget: SHIFT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS,
          navigationMenuItem: SHIFT_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIERS,
        },
      });

    if (totalOperationCount === 0) {
      this.logger.log(
        `Shift standard metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} Shift standard metadata operations for workspace ${workspaceId}`,
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
        `Failed to create Shift standard objects for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create Shift standard objects for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} Shift standard metadata operations for workspace ${workspaceId}`,
    );
  }
}
