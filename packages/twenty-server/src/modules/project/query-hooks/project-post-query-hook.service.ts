import { Injectable } from '@nestjs/common';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  type ActorMetadata,
  FieldActorSource,
  ViewFilterOperand,
  ViewType,
} from 'twenty-shared/types';
import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { ViewFilterService } from 'src/engine/metadata-modules/view-filter/services/view-filter.service';
import { ViewGroupService } from 'src/engine/metadata-modules/view-group/services/view-group.service';
import { ViewService } from 'src/engine/metadata-modules/view/services/view.service';
import { GlobalWorkspaceOrmManager } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-orm.manager';
import { type IssueStatusWorkspaceEntity } from 'src/modules/issue-status/standard-objects/issue-status.workspace-entity';
import { type ProjectWorkspaceEntity } from 'src/modules/project/standard-objects/project.workspace-entity';

// Direct port of the hardcoded global Issue.status SELECT options this
// object replaces (colors copied 1:1 from the old field so existing Kanban
// columns keep the same look, now duplicated per project). `color` values
// are the SELECT option values from
// compute-issue-status-standard-flat-field-metadata.util.ts (uppercase,
// enforced by isSnakeCaseString).
const DEFAULT_ISSUE_STATUSES = [
  { name: 'Backlog', color: 'GRAY', category: 'UNSTARTED' },
  { name: 'Todo', color: 'SKY', category: 'UNSTARTED' },
  { name: 'In Progress', color: 'PURPLE', category: 'STARTED' },
  { name: 'In Review', color: 'ORANGE', category: 'STARTED' },
  { name: 'Done', color: 'GREEN', category: 'DONE' },
] as const;

// This inserts via the repository directly, bypassing the createOne resolver
// (and its global CreatedByCreateOnePreQueryHook), so createdBy/updatedBy
// must be set explicitly here — the side-effect-engine-injected system field
// has no usable default for its `name` sub-column.
const SYSTEM_ACTOR: ActorMetadata = {
  source: FieldActorSource.SYSTEM,
  name: 'System',
  workspaceMemberId: null,
  context: {},
};

@Injectable()
export class ProjectPostQueryHookService {
  constructor(
    private readonly globalWorkspaceOrmManager: GlobalWorkspaceOrmManager,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly viewService: ViewService,
    private readonly viewFilterService: ViewFilterService,
    private readonly viewGroupService: ViewGroupService,
  ) {}

  // Ensures a project has its 5 default statuses AND a dedicated Kanban view
  // (grouped by status, permanently filtered to this project) with matching
  // view groups. Each half is independently idempotent — checked and skipped
  // on its own — because the Kanban view's `mainGroupByFieldMetadataId`
  // points at whatever field row backs `issue.status` AT THE TIME the view
  // is created: if this ran seed-then-flip during the one-time SELECT ->
  // RELATION migration, a view created against the old field id would be
  // orphaned the moment that old field row got deleted. Callers (the
  // project.createOne post-hook, and the 2-28 backfill command) must run the
  // flip before calling this, but the independent idempotency here also lets
  // a stuck workspace (statuses seeded, view lost) self-heal on next call.
  async seedDefaultIssueStatuses(
    authContext: WorkspaceAuthContext,
    project: Pick<ProjectWorkspaceEntity, 'id' | 'name' | 'key'>,
  ): Promise<void> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    const workspaceId = workspace.id;

    const issueStatuses =
      await this.globalWorkspaceOrmManager.executeInWorkspaceContext(
        async () => {
          const issueStatusRepository =
            await this.globalWorkspaceOrmManager.getRepository<IssueStatusWorkspaceEntity>(
              workspaceId,
              'issueStatus',
              { shouldBypassPermissionChecks: true },
            );

          const existingIssueStatuses = await issueStatusRepository.find({
            where: { projectId: project.id },
          });

          if (existingIssueStatuses.length > 0) {
            return existingIssueStatuses;
          }

          return issueStatusRepository.save(
            DEFAULT_ISSUE_STATUSES.map((status, index) => ({
              name: status.name,
              color: status.color,
              category: status.category,
              position: index,
              projectId: project.id,
              createdBy: SYSTEM_ACTOR,
              updatedBy: SYSTEM_ACTOR,
            })),
          );
        },
        authContext,
      );

    const existingKanbanView = await this.findProjectKanbanView(workspaceId);

    if (isDefined(existingKanbanView?.byProjectId[project.id])) {
      return;
    }

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const issueObjectMetadata =
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issue.universalIdentifier
      ];
    const statusFieldMetadata =
      flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issue.fields.status.universalIdentifier
      ];
    const projectFieldMetadata =
      flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issue.fields.project.universalIdentifier
      ];

    // The issue object may not exist yet for a workspace mid-upgrade; in
    // that case there is no Kanban to build, the statuses seeded above are
    // enough.
    if (
      !isDefined(issueObjectMetadata) ||
      !isDefined(statusFieldMetadata) ||
      !isDefined(projectFieldMetadata)
    ) {
      return;
    }

    const view = await this.viewService.createOne({
      workspaceId,
      createViewInput: {
        name: `${project.key} Kanban`,
        objectMetadataId: issueObjectMetadata.id,
        type: ViewType.KANBAN,
        icon: 'IconLayoutKanban',
        mainGroupByFieldMetadataId: statusFieldMetadata.id,
      },
    });

    await this.viewFilterService.createOne({
      workspaceId,
      createViewFilterInput: {
        viewId: view.id,
        fieldMetadataId: projectFieldMetadata.id,
        operand: ViewFilterOperand.IS,
        value: { selectedRecordIds: [project.id] },
      },
    });

    await this.viewGroupService.createMany({
      workspaceId,
      createViewGroupInputs: issueStatuses
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((issueStatus, index) => ({
          viewId: view.id,
          fieldValue: issueStatus.id,
          isVisible: true,
          position: index,
        })),
    });
  }

  // Appends a ViewGroup for a newly created IssueStatus to that project's
  // Kanban view, at the end - existing groups' position/visibility are left
  // untouched so user customization survives.
  async syncViewGroupOnIssueStatusCreate(
    authContext: WorkspaceAuthContext,
    issueStatuses: IssueStatusWorkspaceEntity[],
  ): Promise<void> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    const workspaceId = workspace.id;

    const kanbanView = await this.findProjectKanbanView(workspaceId);

    if (!isDefined(kanbanView)) {
      return;
    }

    for (const issueStatus of issueStatuses) {
      const view = kanbanView.byProjectId[issueStatus.projectId];

      if (!isDefined(view)) {
        continue;
      }

      const maxPosition = view.viewGroups.reduce(
        (max, viewGroup) => Math.max(max, viewGroup.position),
        -1,
      );

      await this.viewGroupService.createOne({
        workspaceId,
        createViewGroupInput: {
          viewId: view.id,
          fieldValue: issueStatus.id,
          isVisible: true,
          position: maxPosition + 1,
        },
      });
    }
  }

  // Removes the ViewGroup matching a deleted/soft-deleted IssueStatus from
  // that project's Kanban view - other groups' position/visibility are
  // left untouched.
  async syncViewGroupOnIssueStatusDelete(
    authContext: WorkspaceAuthContext,
    issueStatuses: IssueStatusWorkspaceEntity[],
  ): Promise<void> {
    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    const workspaceId = workspace.id;

    const kanbanView = await this.findProjectKanbanView(workspaceId);

    if (!isDefined(kanbanView)) {
      return;
    }

    for (const issueStatus of issueStatuses) {
      const view = kanbanView.byProjectId[issueStatus.projectId];
      const viewGroupToRemove = view?.viewGroups.find(
        (viewGroup) => viewGroup.fieldValue === issueStatus.id,
      );

      if (!isDefined(viewGroupToRemove)) {
        continue;
      }

      await this.viewGroupService.deleteOne({
        workspaceId,
        deleteViewGroupInput: { id: viewGroupToRemove.id },
      });
    }
  }

  // Loads every per-project Kanban view for `issue` (identified by their
  // permanent `project` filter), keyed by projectId so callers can look up
  // the right view for each IssueStatus without a query per row.
  private async findProjectKanbanView(workspaceId: string): Promise<{
    byProjectId: Record<
      string,
      {
        id: string;
        viewGroups: { id: string; fieldValue: string; position: number }[];
      }
    >;
  } | null> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const issueObjectMetadata =
      flatObjectMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issue.universalIdentifier
      ];
    const projectFieldMetadata =
      flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.issue.fields.project.universalIdentifier
      ];

    if (!isDefined(issueObjectMetadata) || !isDefined(projectFieldMetadata)) {
      return null;
    }

    const issueViews = await this.viewService.findByObjectMetadataIdWithRelations(
      workspaceId,
      issueObjectMetadata.id,
      undefined,
      [ViewType.KANBAN],
    );

    const byProjectId: Record<
      string,
      { id: string; viewGroups: { id: string; fieldValue: string; position: number }[] }
    > = {};

    for (const view of issueViews) {
      const projectFilter = (view.viewFilters ?? []).find(
        (viewFilter) => viewFilter.fieldMetadataId === projectFieldMetadata.id,
      );

      if (!isDefined(projectFilter)) {
        continue;
      }

      const projectIds = this.parseSelectedRecordIds(projectFilter.value);

      for (const projectId of projectIds) {
        byProjectId[projectId] = {
          id: view.id,
          viewGroups: (view.viewGroups ?? []).map((viewGroup) => ({
            id: viewGroup.id,
            fieldValue: viewGroup.fieldValue,
            position: viewGroup.position,
          })),
        };
      }
    }

    return { byProjectId };
  }

  private parseSelectedRecordIds(value: unknown): string[] {
    if (isDefined(value) && typeof value === 'object' && 'selectedRecordIds' in value) {
      const { selectedRecordIds } = value as { selectedRecordIds?: unknown };

      if (Array.isArray(selectedRecordIds)) {
        return selectedRecordIds.filter(
          (id): id is string => typeof id === 'string',
        );
      }
    }

    return [];
  }
}
