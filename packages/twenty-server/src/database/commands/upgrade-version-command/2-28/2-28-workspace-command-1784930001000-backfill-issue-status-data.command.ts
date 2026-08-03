import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IsNull, Not } from 'typeorm';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type IssueStatusWorkspaceEntity } from 'src/modules/issue-status/standard-objects/issue-status.workspace-entity';
import { ProjectPostQueryHookService } from 'src/modules/project/query-hooks/project-post-query-hook.service';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

const STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.issue.fields.status.universalIdentifier;
const ISSUE_STATUS_ISSUES_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECTS.issueStatus.fields.issues.universalIdentifier;

// Direct port of the old Issue.status SELECT option values this object
// replaces, mapped to the seeded IssueStatus.name they resolve to.
const LEGACY_STATUS_VALUE_TO_NAME: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

type LegacyIssueRow = { id: string; status: string | null; projectId: string };
type IssueWithStatusIdRow = { id: string; statusId: string | null };

// Runs after (higher timestamp than) 2-28's
// sync-issue-status-standard-objects command, which guarantees the
// `issueStatus` table already exists.
//
// Order matters here: the flip runs BEFORE seeding, not after. Each
// project's Kanban view is created with `mainGroupByFieldMetadataId`
// pointing at whatever field row currently backs `issue.status` — if
// seeding ran first (against the legacy SELECT field's row) and the flip
// then deleted that row to replace it with a RELATION-typed one, every view
// just created would be orphaned by the delete. Flipping first means
// seeding always targets the field id that will persist. This command
// still does two things: (1) reads every issue's raw legacy string value
// BEFORE flipping the field to a RELATION (that flip drops the string
// column), so the values captured here can be resolved to the new statusId
// once the flip has happened — losing that window is why this can't be
// split into separate command runs; (2) seeds default IssueStatus rows and
// a per-project Kanban view for any project missing either (reusing the
// exact same, independently-idempotent service method project.createOne's
// post-hook uses), which self-heals a workspace stuck in the seed-before-flip
// state from an earlier version of this command.
@RegisteredWorkspaceCommand('2.28.0', 1784930001000)
@Command({
  name: 'upgrade:2-28:backfill-issue-status-data',
  description:
    'Seed default IssueStatus rows for projects missing them, then flip Issue.status from SELECT to RELATION and remap legacy string values to the new statusId. Idempotent.',
})
export class BackfillIssueStatusDataCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly projectPostQueryHookService: ProjectPostQueryHookService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const isDryRun = options.dryRun ?? false;
    const authContext = buildSystemAuthContext(workspaceId);

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
    ]);

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

    const hasIssueStatusObject = isDefined(
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issueStatus.universalIdentifier
      ],
    );

    if (!hasIssueStatusObject) {
      this.logger.log(
        `IssueStatus object does not exist for workspace ${workspaceId} (run upgrade:2-28:sync-issue-status-standard-objects first), skipping`,
      );

      return;
    }

    const statusField =
      flatFieldMetadataMaps.byUniversalIdentifier[
        STATUS_FIELD_UNIVERSAL_IDENTIFIER
      ];
    const needsStatusFlip =
      isDefined(statusField) && statusField.type !== FieldMetadataType.RELATION;

    const { projects, projectsWithoutIssueStatuses, legacyIssues } =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const projectRepository =
            await this.globalWorkspaceOrmManager.getRepository<ProjectWorkspaceEntity>(
              workspaceId,
              'project',
              { shouldBypassPermissionChecks: true },
            );
          const issueStatusRepository =
            await this.globalWorkspaceOrmManager.getRepository<IssueStatusWorkspaceEntity>(
              workspaceId,
              'issueStatus',
              { shouldBypassPermissionChecks: true },
            );

          const projects = await projectRepository.find();
          const projectsWithoutIssueStatuses: ProjectWorkspaceEntity[] = [];

          for (const project of projects) {
            const existingCount = await issueStatusRepository.count({
              where: { projectId: project.id },
            });

            if (existingCount === 0) {
              projectsWithoutIssueStatuses.push(project);
            }
          }

          let legacyIssues: LegacyIssueRow[] = [];

          if (needsStatusFlip) {
            const legacyIssueRepository =
              await this.globalWorkspaceOrmManager.getRepository<LegacyIssueRow>(
                workspaceId,
                'issue',
                { shouldBypassPermissionChecks: true },
              );

            legacyIssues = await legacyIssueRepository.find({
              where: { status: Not(IsNull()) },
            });
          }

          return { projects, projectsWithoutIssueStatuses, legacyIssues };
        },
        authContext,
      );

    // `projectsWithoutIssueStatuses.length === 0` doesn't mean there's
    // nothing left to do — a project can already have its 5 statuses but
    // still be missing its Kanban view (the seed-before-flip failure mode
    // this reordering fixes going forward). `seedDefaultIssueStatuses` is
    // independently idempotent per half, so it's always safe — and cheap —
    // to call for every project rather than trying to predict which ones
    // need it.
    const totalWork = projects.length + (needsStatusFlip ? 1 : 0);

    if (totalWork === 0) {
      this.logger.log(
        `Nothing to backfill for workspace ${workspaceId}, skipping`,
      );

      return;
    }

    if (isDryRun) {
      this.logger.log(
        `[DRY RUN] Would ensure default statuses + Kanban view for ${projects.length} project(s) (${projectsWithoutIssueStatuses.length} missing statuses) for workspace ${workspaceId}${
          needsStatusFlip
            ? `, flip Issue.status to a relation, and remap ${legacyIssues.length} legacy issue(s)`
            : ''
        }`,
      );

      return;
    }

    if (needsStatusFlip && isDefined(statusField)) {
      await this.flipStatusFieldToRelation({ workspaceId, statusField });

      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
      ]);

      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const issueStatusRepository =
            await this.globalWorkspaceOrmManager.getRepository<IssueStatusWorkspaceEntity>(
              workspaceId,
              'issueStatus',
              { shouldBypassPermissionChecks: true },
            );
          const issueRepository =
            await this.globalWorkspaceOrmManager.getRepository<IssueWithStatusIdRow>(
              workspaceId,
              'issue',
              { shouldBypassPermissionChecks: true },
            );

          const allIssueStatuses = await issueStatusRepository.find();
          const issueStatusIdByProjectAndName = new Map<string, string>();

          for (const issueStatus of allIssueStatuses) {
            issueStatusIdByProjectAndName.set(
              `${issueStatus.projectId}::${issueStatus.name}`,
              issueStatus.id,
            );
          }

          for (const legacyIssue of legacyIssues) {
            const statusName = legacyIssue.status
              ? LEGACY_STATUS_VALUE_TO_NAME[legacyIssue.status]
              : undefined;

            if (!isDefined(statusName)) {
              continue;
            }

            const statusId = issueStatusIdByProjectAndName.get(
              `${legacyIssue.projectId}::${statusName}`,
            );

            if (!isDefined(statusId)) {
              continue;
            }

            await issueRepository.update(
              { id: legacyIssue.id },
              { statusId },
            );
          }
        },
        authContext,
      );
    }

    for (const project of projects) {
      await this.projectPostQueryHookService.seedDefaultIssueStatuses(
        authContext,
        project,
      );
    }

    this.logger.log(
      `Ensured default statuses + Kanban view for ${projects.length} project(s) (${projectsWithoutIssueStatuses.length} were missing statuses) for workspace ${workspaceId}${
        needsStatusFlip
          ? `, flipped Issue.status to a relation, and remapped ${legacyIssues.length} legacy issue(s)`
          : ''
      }`,
    );
  }

  // Runs as two separate migrations, not one delete+create batch: the engine
  // folds a delete and a create sharing the same universalIdentifier into an
  // "update" (verified against the live DB, not just unit tests — that fold
  // rejects the SELECT -> RELATION type change with "Options are required
  // for enum fields", since it validates the update as if the field were
  // still SELECT-typed). Deleting `issue.status` (SELECT) first, then
  // creating it fresh as a RELATION together with `issueStatus.issues` (its
  // ONE_TO_MANY reverse side — the engine also rejects a relation field
  // whose target isn't itself RELATION-typed yet, so `issues` can't be
  // created ahead of this flip) avoids the same-identifier fold. No data
  // risk from running as two DB round-trips: legacy string values were
  // already read into memory (`legacyIssues`) before this method is called.
  private async flipStatusFieldToRelation({
    workspaceId,
    statusField,
  }: {
    workspaceId: string;
    statusField: FlatFieldMetadata;
  }): Promise<void> {
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

    const standardStatusField =
      standardAllFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
        STATUS_FIELD_UNIVERSAL_IDENTIFIER
      ];
    const standardIssueStatusIssuesField =
      standardAllFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
        ISSUE_STATUS_ISSUES_FIELD_UNIVERSAL_IDENTIFIER
      ];

    if (!isDefined(standardStatusField)) {
      throw new Error(
        `Could not find standard entity ${STATUS_FIELD_UNIVERSAL_IDENTIFIER}`,
      );
    }

    if (!isDefined(standardIssueStatusIssuesField)) {
      throw new Error(
        `Could not find standard entity ${ISSUE_STATUS_ISSUES_FIELD_UNIVERSAL_IDENTIFIER}`,
      );
    }

    const deleteResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: [],
              flatEntityToDelete: [statusField],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (deleteResult.status === 'fail') {
      this.logger.error(
        `Failed to delete legacy Issue.status for workspace ${workspaceId}:\n${JSON.stringify(deleteResult, null, 2)}`,
      );

      throw new Error(
        `Failed to delete legacy Issue.status for workspace ${workspaceId}`,
      );
    }

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
    ]);

    const createResult =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigration(
        {
          workspaceId,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: [
                standardStatusField,
                standardIssueStatusIssuesField,
              ],
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (createResult.status === 'fail') {
      this.logger.error(
        `Failed to create relation Issue.status for workspace ${workspaceId}:\n${JSON.stringify(createResult, null, 2)}`,
      );

      throw new Error(
        `Failed to create relation Issue.status for workspace ${workspaceId}`,
      );
    }
  }
}
