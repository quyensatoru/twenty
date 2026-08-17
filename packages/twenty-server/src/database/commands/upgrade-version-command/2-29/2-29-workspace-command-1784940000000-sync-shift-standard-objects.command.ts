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
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatNavigationMenuItem } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type FlatPageLayoutTab } from 'src/engine/metadata-modules/flat-page-layout-tab/types/flat-page-layout-tab.type';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { type FlatPageLayout } from 'src/engine/metadata-modules/flat-page-layout/types/flat-page-layout.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_NAVIGATION_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-navigation-menu-item.constant';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
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

// System fields (id/createdAt/updatedAt/deletedAt/position/createdBy/updatedBy/
// searchVector) are deliberately excluded — the side-effect engine injects
// them for a newly created object. Both sides of every relation pair are
// listed explicitly since the engine does not auto-generate the reverse side:
//   shift.member <-> workspaceMember.shifts
//   shift.shiftTemplate <-> shiftTemplate.shifts
const SHIFT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
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

const getMissingStandardFlatEntitiesOrThrow = <T extends SyncableFlatEntity>({
  standardFlatEntityMaps,
  existingFlatEntityMaps,
  universalIdentifiers,
}: {
  standardFlatEntityMaps: FlatEntityMaps<T>;
  existingFlatEntityMaps: FlatEntityMaps<T>;
  universalIdentifiers: string[];
}): T[] =>
  universalIdentifiers.flatMap((universalIdentifier) => {
    if (
      isDefined(
        existingFlatEntityMaps.byUniversalIdentifier[universalIdentifier],
      )
    ) {
      return [];
    }

    const standardEntity =
      standardFlatEntityMaps.byUniversalIdentifier[universalIdentifier];

    if (!isDefined(standardEntity)) {
      throw new Error(`Could not find standard entity ${universalIdentifier}`);
    }

    return [standardEntity];
  });

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

    const now = new Date().toISOString();

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now,
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const allFlatEntityOperationByMetadataName = {
      objectMetadata: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatObjectMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatObjectMetadataMaps,
            existingFlatEntityMaps: flatObjectMetadataMaps,
            universalIdentifiers: SHIFT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      fieldMetadata: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatFieldMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatFieldMetadataMaps,
            existingFlatEntityMaps: flatFieldMetadataMaps,
            universalIdentifiers: SHIFT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      index: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatIndexMetadata>({
            standardFlatEntityMaps: standardAllFlatEntityMaps.flatIndexMaps,
            existingFlatEntityMaps: flatIndexMaps,
            universalIdentifiers: SHIFT_INDEX_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      view: {
        flatEntityToCreate: getMissingStandardFlatEntitiesOrThrow<FlatView>({
          standardFlatEntityMaps: standardAllFlatEntityMaps.flatViewMaps,
          existingFlatEntityMaps: flatViewMaps,
          universalIdentifiers: SHIFT_VIEW_UNIVERSAL_IDENTIFIERS,
        }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      viewField: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatViewField>({
            standardFlatEntityMaps: standardAllFlatEntityMaps.flatViewFieldMaps,
            existingFlatEntityMaps: flatViewFieldMaps,
            universalIdentifiers: SHIFT_VIEW_FIELD_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      pageLayout: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatPageLayout>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatPageLayoutMaps,
            existingFlatEntityMaps: flatPageLayoutMaps,
            universalIdentifiers: SHIFT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      pageLayoutTab: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatPageLayoutTab>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatPageLayoutTabMaps,
            existingFlatEntityMaps: flatPageLayoutTabMaps,
            universalIdentifiers: SHIFT_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      pageLayoutWidget: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatPageLayoutWidget>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatPageLayoutWidgetMaps,
            existingFlatEntityMaps: flatPageLayoutWidgetMaps,
            universalIdentifiers:
              SHIFT_PAGE_LAYOUT_WIDGET_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
      navigationMenuItem: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatNavigationMenuItem>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatNavigationMenuItemMaps,
            existingFlatEntityMaps: flatNavigationMenuItemMaps,
            universalIdentifiers:
              SHIFT_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: [],
        flatEntityToUpdate: [],
      },
    };

    const totalOperationCount = Object.values(
      allFlatEntityOperationByMetadataName,
    ).reduce(
      (total, operations) => total + operations.flatEntityToCreate.length,
      0,
    );

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
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
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
