import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  PRODUCT_BACKLOG_LOGIC_FUNCTION_UID,
  PRODUCT_BACKLOG_ROUTE_PATH,
} from '../constants/product-backlog';
import {
  EPIC_SELECTION,
  ISSUE_STATUS_SELECTION,
  PRODUCT_ITEM_SELECTION,
  PROJECT_SELECTION,
  SPRINT_SELECTION,
} from '../constants/record-selections';
import { type ApiClient } from '../types/api-client';
import {
  type Idea,
  type LinkedIssueSummary,
  type ProductItem,
  type ProductSprint,
  type SprintVelocity,
} from '../types/product-backlog';
import { readProductBacklogSettings } from '../utils/read-product-backlog-settings.util';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import { listAppMembers } from './utils/list-app-members.util';
import { listIssueMembers } from './utils/list-issue-members.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { migrateBacklogColumnToItems } from './utils/migrate-backlog-column-to-items.util';
import { migrateProjectToProductBacklog } from './utils/migrate-project-to-product-backlog.util';
import { resolveProductBacklogAccess } from './utils/resolve-product-backlog-access.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type ProductBacklogBody = { projectId?: string };

type ProjectRow = {
  id: string;
  appId?: string | null;
  productBacklogSettings?: unknown;
};

// Enough closed sprints for the velocity chart; the average uses the last few.
const VELOCITY_HISTORY_SPRINT_COUNT = 8;

const sumIssuePoints = async (
  client: ApiClient,
  filter: Record<string, unknown>,
): Promise<number> => {
  const result = await client.query({
    issues: { __args: { filter, first: 1 }, sumStoryPoints: true },
  });

  return (
    (result?.issues as { sumStoryPoints?: number | null } | undefined)
      ?.sumStoryPoints ?? 0
  );
};

// A sprint that predates the snapshots falls back to what it still holds:
// completing a sprint moves unfinished work out, so the remainder is its
// done work, which is the best estimate of both numbers left.
const readSprintVelocity = async ({
  client,
  sprint,
  doneStatusIds,
}: {
  client: ApiClient;
  sprint: ProductSprint;
  doneStatusIds: readonly string[];
}): Promise<SprintVelocity> => {
  const isActive = sprint.state === 'ACTIVE';
  const inSprint = { sprintId: { eq: sprint.id }, parentId: { is: 'NULL' } };
  const [totalPoints, donePoints] = await Promise.all([
    typeof sprint.committedPoints === 'number' && !isActive
      ? Promise.resolve(sprint.committedPoints)
      : sumIssuePoints(client, inSprint),
    typeof sprint.completedPoints === 'number'
      ? Promise.resolve(sprint.completedPoints)
      : doneStatusIds.length === 0
        ? Promise.resolve(0)
        : sumIssuePoints(client, {
            ...inSprint,
            statusId: { in: [...doneStatusIds] },
          }),
  ]);

  return {
    sprintId: sprint.id,
    name: sprint.name ?? '',
    committedPoints:
      isActive && typeof sprint.committedPoints === 'number'
        ? sprint.committedPoints
        : totalPoints,
    completedPoints: donePoints,
    isActive,
  };
};

const readDoneAtByIssueId = async ({
  client,
  issueIds,
  doneStatusIds,
}: {
  client: ApiClient;
  issueIds: readonly string[];
  doneStatusIds: readonly string[];
}): Promise<Record<string, string>> => {
  if (issueIds.length === 0 || doneStatusIds.length === 0) {
    return {};
  }

  const histories = await listScopedRecords<{
    issueId?: string | null;
    createdAt?: string | null;
  }>({
    client,
    pluralName: 'issueHistories',
    filter: {
      issueId: { in: [...issueIds] },
      action: { eq: 'status-changed' },
      toStatusId: { in: [...doneStatusIds] },
    },
    selection: { id: true, issueId: true, createdAt: true },
  });

  return histories.reduce<Record<string, string>>((doneAt, history) => {
    if (
      typeof history.issueId === 'string' &&
      typeof history.createdAt === 'string' &&
      (doneAt[history.issueId] ?? '') < history.createdAt
    ) {
      doneAt[history.issueId] = history.createdAt;
    }

    return doneAt;
  }, {});
};

// One round trip for the whole Product Backlog page: the project's items and
// planned sprints, the active sprint, ideas, settings and the numbers its
// Insights draw. Items are read in full rather than paged, since scoring,
// refinement and health all rank the backlog as a whole.
const handler = async (event: RoutePayload<ProductBacklogBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    // NONE still gets the sprint numbers: the Board's Insights read them here.
    const access = resolveProductBacklogAccess(scope);
    const canSeeBacklog = access !== 'NONE';
    const visibleProjectIds = await listVisibleProjectIds({
      client,
      scope,
      operation: 'read',
    });
    const projects =
      visibleProjectIds !== null && visibleProjectIds.length === 0
        ? []
        : await listScopedRecords<ProjectRow>({
            client,
            pluralName: 'projects',
            filter: buildProjectScopeFilter(visibleProjectIds, 'id'),
            selection: { ...PROJECT_SELECTION, productBacklogSettings: true },
            orderBy: [{ name: 'AscNullsLast' }],
          });

    if (projects.length === 0) {
      return {
        projects: [],
        activeProjectId: null,
        currentWorkspaceMemberId: scope.workspaceMemberId,
        access,
      };
    }

    const requestedProjectId =
      typeof event.body?.projectId === 'string' ? event.body.projectId : null;
    const activeProject =
      projects.find((project) => project.id === requestedProjectId) ??
      projects[0];
    const projectId = activeProject.id;
    const appId = activeProject.appId ?? null;

    await migrateProjectToProductBacklog(client, projectId);
    await migrateBacklogColumnToItems(client, projectId);

    const [issueStatuses, sprints, epics, ideas, assignableMembers] =
      await Promise.all([
        listScopedRecords<{ id: string; category?: string | null }>({
          client,
          pluralName: 'issueStatuses',
          filter: { projectId: { eq: projectId } },
          selection: ISSUE_STATUS_SELECTION,
          orderBy: [{ position: 'AscNullsLast' }],
        }),
        listScopedRecords<ProductSprint>({
          client,
          pluralName: 'sprints',
          filter: { projectId: { eq: projectId } },
          selection: SPRINT_SELECTION,
          orderBy: [{ position: 'AscNullsLast' }],
        }),
        listScopedRecords({
          client,
          pluralName: 'epics',
          filter: { projectId: { eq: projectId } },
          selection: EPIC_SELECTION,
          orderBy: [{ position: 'AscNullsLast' }],
        }),
        !canSeeBacklog
          ? Promise.resolve([])
          : listScopedRecords<Idea>({
              client,
              pluralName: 'ideas',
              filter: { projectId: { eq: projectId } },
              selection: {
                id: true,
                title: true,
                description: true,
                source: true,
                requester: true,
                requestCount: true,
                quote: true,
                status: true,
                promotedIssueId: true,
                createdAt: true,
              },
              orderBy: [{ createdAt: 'DescNullsLast' }],
            }),
        appId === null
          ? Promise.resolve([])
          : listAppMembers({ client, appId }),
      ]);

    const doneStatusIds = issueStatuses
      .filter((status) => status.category === 'DONE')
      .map((status) => status.id);
    const futureSprintIds = sprints
      .filter((sprint) => sprint.state === 'FUTURE' || sprint.state === null)
      .map((sprint) => sprint.id);
    const activeSprint = sprints.find((sprint) => sprint.state === 'ACTIVE');

    const [items, activeSprintIssues] = await Promise.all([
      !canSeeBacklog
        ? Promise.resolve([])
        : listScopedRecords<ProductItem>({
            client,
            pluralName: 'issues',
            filter: {
              and: [
                { projectId: { eq: projectId } },
                { parentId: { is: 'NULL' } },
                {
                  or: [
                    { stage: { eq: 'ITEM' } },
                    ...(futureSprintIds.length === 0
                      ? []
                      : [{ sprintId: { in: futureSprintIds } }]),
                  ],
                },
                { stage: { neq: 'ARCHIVED' } },
              ],
            },
            selection: PRODUCT_ITEM_SELECTION,
            orderBy: [{ position: 'AscNullsLast' }],
          }),
      activeSprint === undefined
        ? Promise.resolve([])
        : listScopedRecords<ProductItem>({
            client,
            pluralName: 'issues',
            filter: {
              sprintId: { eq: activeSprint.id },
              parentId: { is: 'NULL' },
            },
            selection: PRODUCT_ITEM_SELECTION,
            orderBy: [{ position: 'AscNullsLast' }],
          }),
    ]);

    const loadedIssueIds = new Set(
      [...items, ...activeSprintIssues].map((issue) => issue.id),
    );
    const missingBlockerIds = [
      ...new Set(
        [...items, ...activeSprintIssues].flatMap((issue) =>
          Array.isArray(issue.blockedByIssueIds) ? issue.blockedByIssueIds : [],
        ),
      ),
    ].filter(
      (issueId) => typeof issueId === 'string' && !loadedIssueIds.has(issueId),
    );
    const closedSprints = sprints
      .filter((sprint) => sprint.state === 'CLOSED')
      .sort((left, right) =>
        (left.completeDate ?? left.endDate ?? '').localeCompare(
          right.completeDate ?? right.endDate ?? '',
        ),
      )
      .slice(-VELOCITY_HISTORY_SPRINT_COUNT);

    const [linkedIssues, doneAtByIssueId, velocity, members] =
      await Promise.all([
        missingBlockerIds.length === 0
          ? Promise.resolve([])
          : listScopedRecords<LinkedIssueSummary>({
              client,
              pluralName: 'issues',
              filter: { id: { in: missingBlockerIds } },
              selection: {
                id: true,
                issueKey: true,
                title: true,
                statusId: true,
                stage: true,
              },
            }),
        // Only work that is done now: an issue reopened after reaching done
        // still has that old entry in its history.
        readDoneAtByIssueId({
          client,
          issueIds: activeSprintIssues
            .filter((issue) => doneStatusIds.includes(issue.statusId ?? ''))
            .map((issue) => issue.id),
          doneStatusIds,
        }),
        Promise.all(
          [
            ...closedSprints,
            ...(activeSprint === undefined ? [] : [activeSprint]),
          ].map((sprint) =>
            readSprintVelocity({ client, sprint, doneStatusIds }),
          ),
        ),
        listIssueMembers({ client, issues: [...items, ...activeSprintIssues] }),
      ]);

    // Work done before the History feed existed has no entry; its last edit
    // is the closest date there is.
    for (const issue of activeSprintIssues) {
      if (
        doneStatusIds.includes(issue.statusId ?? '') &&
        doneAtByIssueId[issue.id] === undefined &&
        typeof issue.updatedAt === 'string'
      ) {
        doneAtByIssueId[issue.id] = issue.updatedAt;
      }
    }

    return {
      projects: projects.map(
        ({ productBacklogSettings: _settings, ...project }) => project,
      ),
      activeProjectId: projectId,
      settings: readProductBacklogSettings(
        activeProject.productBacklogSettings,
      ),
      issueStatuses,
      sprints,
      epics,
      items,
      activeSprintIssues,
      doneAtByIssueId,
      linkedIssues,
      ideas,
      velocity,
      members,
      assignableMembers,
      currentWorkspaceMemberId: scope.workspaceMemberId,
      access,
      canConfigureAccess:
        scope.canBypassAppScope && scope.workspaceMemberId !== null,
      canWrite: access === 'EDIT' && hasAppGrant(scope, appId, 'write'),
      canSoftDelete:
        access === 'EDIT' && hasAppGrant(scope, appId, 'softDelete'),
    };
  });

export default defineLogicFunction({
  universalIdentifier: PRODUCT_BACKLOG_LOGIC_FUNCTION_UID,
  name: 'product-backlog',
  description:
    "Route: a project's Product Backlog — items, planned and active sprints, ideas, settings and velocity.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: PRODUCT_BACKLOG_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
