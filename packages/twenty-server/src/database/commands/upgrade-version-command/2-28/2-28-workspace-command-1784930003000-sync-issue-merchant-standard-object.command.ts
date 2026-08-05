import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const ISSUE_MERCHANT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueMerchant.universalIdentifier,
];

// System fields (id/createdAt/updatedAt/deletedAt/position/createdBy/updatedBy/
// searchVector) are deliberately excluded — the side-effect engine injects
// them for a newly created object. Both sides of the many-to-many pair are
// listed explicitly since the engine does not auto-generate the reverse side.
const ISSUE_MERCHANT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueMerchant.fields.issue.universalIdentifier,
  STANDARD_OBJECTS.issueMerchant.fields.merchant.universalIdentifier,
  STANDARD_OBJECTS.issue.fields.merchants.universalIdentifier,
  STANDARD_OBJECTS.merchant.fields.issues.universalIdentifier,
];

const ISSUE_MERCHANT_INDEX_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.issueMerchant.indexes.issueIdIndex.universalIdentifier,
  STANDARD_OBJECTS.issueMerchant.indexes.merchantIssueUniqueIndex
    .universalIdentifier,
];

// A prior, unreleased version of upgrade:2-28:sync-issue-epic-sprint-app-scope-relations
// created a direct many-to-one Issue.merchant (+ Merchant.issues reverse +
// Issue.merchantIdIndex), before this junction-based many-to-many replaced it.
// Any workspace that already ran that version has these hanging around under
// the OLD universal identifiers (removed from STANDARD_OBJECTS, so they can
// only be referenced literally here) and must have them deleted first, or
// creating the new same-named Issue.merchants/Merchant.issues fields below
// collides on the (name, objectMetadataId, workspaceId) unique index. Both
// were guaranteed nullable and unbackfilled, so deleting them drops no real
// data.
const OLD_ISSUE_MERCHANT_FIELD_UNIVERSAL_IDENTIFIER =
  '5180b84c-0866-4018-9fba-aeb7d661804a';
const OLD_MERCHANT_ISSUES_FIELD_UNIVERSAL_IDENTIFIER =
  '19dfe96d-49c9-477d-891b-568fdc4d2cde';
const OLD_ISSUE_MERCHANT_ID_INDEX_UNIVERSAL_IDENTIFIER =
  '978c4541-360b-4c5f-a6d9-4572f7cdb741';

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

@RegisteredWorkspaceCommand('2.28.0', 1784930003000)
@Command({
  name: 'upgrade:2-28:sync-issue-merchant-standard-object',
  description:
    'Create the IssueMerchant junction object (fields, index) and the Issue.merchants/Merchant.issues many-to-many relation fields in existing workspaces',
})
export class SyncIssueMerchantStandardObjectCommand extends ProvisionedWorkspaceCommandRunner {
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

    const { flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatIndexMaps',
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

    const now = new Date().toISOString();

    const { allFlatEntityMaps: standardAllFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now,
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const oldFieldsToDelete = [
      OLD_ISSUE_MERCHANT_FIELD_UNIVERSAL_IDENTIFIER,
      OLD_MERCHANT_ISSUES_FIELD_UNIVERSAL_IDENTIFIER,
    ]
      .map((universalIdentifier) =>
        findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
          flatEntityMaps: flatFieldMetadataMaps,
          universalIdentifier,
        }),
      )
      .filter(isDefined);

    const oldIndexesToDelete = [
      OLD_ISSUE_MERCHANT_ID_INDEX_UNIVERSAL_IDENTIFIER,
    ]
      .map((universalIdentifier) =>
        findFlatEntityByUniversalIdentifier<FlatIndexMetadata>({
          flatEntityMaps: flatIndexMaps,
          universalIdentifier,
        }),
      )
      .filter(isDefined);

    const allFlatEntityOperationByMetadataName = {
      objectMetadata: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatObjectMetadata>({
            standardFlatEntityMaps:
              standardAllFlatEntityMaps.flatObjectMetadataMaps,
            existingFlatEntityMaps: flatObjectMetadataMaps,
            universalIdentifiers:
              ISSUE_MERCHANT_OBJECT_METADATA_UNIVERSAL_IDENTIFIERS,
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
            universalIdentifiers:
              ISSUE_MERCHANT_FIELD_METADATA_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: oldFieldsToDelete,
        flatEntityToUpdate: [],
      },
      index: {
        flatEntityToCreate:
          getMissingStandardFlatEntitiesOrThrow<FlatIndexMetadata>({
            standardFlatEntityMaps: standardAllFlatEntityMaps.flatIndexMaps,
            existingFlatEntityMaps: flatIndexMaps,
            universalIdentifiers: ISSUE_MERCHANT_INDEX_UNIVERSAL_IDENTIFIERS,
          }),
        flatEntityToDelete: oldIndexesToDelete,
        flatEntityToUpdate: [],
      },
    };

    const totalOperationCount = Object.values(
      allFlatEntityOperationByMetadataName,
    ).reduce(
      (total, operations) =>
        total +
        operations.flatEntityToCreate.length +
        operations.flatEntityToDelete.length,
      0,
    );

    if (totalOperationCount === 0) {
      this.logger.log(
        `IssueMerchant standard metadata already exists for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would apply ${totalOperationCount} IssueMerchant standard metadata operations for workspace ${workspaceId} (including ${oldFieldsToDelete.length + oldIndexesToDelete.length} obsolete direct-relation deletion(s))`,
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
        `Failed to create IssueMerchant standard object for workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
      );

      throw new Error(
        `Failed to create IssueMerchant standard object for workspace ${workspaceId}`,
      );
    }

    this.logger.log(
      `Applied ${totalOperationCount} IssueMerchant standard metadata operations for workspace ${workspaceId}`,
    );
  }
}
