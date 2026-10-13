import { isNonEmptyString, isObject } from '@sniptt/guards';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  ISSUE_SEARCH_SELECTION,
  ISSUE_STATUS_SELECTION,
} from '../constants/record-selections';
import {
  TASK_PERSONAL_BOARD_LOGIC_FUNCTION_UID,
  TASK_PERSONAL_BOARD_PAGE_SIZE,
  TASK_PERSONAL_BOARD_ROUTE_PATH,
} from '../constants/task-personal-board';
import { type Connection } from '../types/connection';
import {
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
} from '../types/task-manager-rows';
import {
  type PersonalBoardData,
  type PersonalBoardStateRow,
} from '../types/task-personal-board';
import {
  readPersonalBoardPlan,
  readPersonalBoardPreferences,
} from '../utils/read-personal-board-state.util';
import { AppScopePermissionDeniedError } from './app-scope/app-scope-error';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { buildProjectScopeFilter } from './app-scope/build-project-scope-filter.util';
import { hasAppGrant } from './app-scope/has-app-grant.util';
import { listVisibleProjectIds } from './app-scope/list-visible-project-ids.util';
import {
  createDiscussionRowOnce,
  requireDiscussionMember,
} from './utils/discussion-storage.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import {
  getPersonalBoardStateId,
  PERSONAL_BOARD_STATE_SELECTION,
  readPersonalBoardPreferencesForMember,
} from './utils/personal-board-storage.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type PersonalBoardBody = {
  action?: 'read' | 'preferences' | 'plan';
  after?: string;
  issueId?: string;
  patch?: unknown;
};

const handler = async (event: RoutePayload<PersonalBoardBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const memberId = requireDiscussionMember(scope);
    const action = event.body?.action ?? 'read';
    if (action !== 'read') {
      if (action !== 'preferences' && action !== 'plan')
        throw new Error('Unknown personal board action.');
      if (!isObject(event.body?.patch))
        throw new Error('A board update is required.');
      const patch = event.body.patch as Record<string, unknown>;
      const issueId =
        action === 'plan'
          ? requireString(event.body?.issueId, 'issueId')
          : null;
      if (issueId !== null) {
        await assertRecordInScope({
          client,
          scope,
          objectNameSingular: 'issue',
          recordId: issueId,
          operation: 'read',
        });
        const [issue] = await listScopedRecords<IssueRow>({
          client,
          pluralName: 'issues',
          filter: { id: { eq: issueId }, assigneeId: { eq: memberId } },
          selection: { id: true },
          maxRecords: 1,
        });
        if (!issue) throw new AppScopePermissionDeniedError();
        if (
          patch.column !== undefined &&
          !['inbox', 'today', 'next'].includes(String(patch.column))
        )
          throw new Error('Choose a personal planning column.');
        if (
          patch.rank !== undefined &&
          (typeof patch.rank !== 'number' ||
            !Number.isFinite(patch.rank) ||
            Math.abs(patch.rank) > 1e9)
        )
          throw new Error('Invalid task order.');
        if (patch.isPinned !== undefined && typeof patch.isPinned !== 'boolean')
          throw new Error('Invalid pin value.');
      }
      const id = getPersonalBoardStateId(memberId, issueId);
      const existing = await createDiscussionRowOnce<PersonalBoardStateRow>({
        client,
        singularName: 'taskPersonalBoardState',
        pluralName: 'taskPersonalBoardStates',
        data: {
          id,
          memberId,
          issueId,
          name: issueId ?? 'Board preferences',
          configuration: {},
        },
        selection: PERSONAL_BOARD_STATE_SELECTION,
      });
      if (existing.memberId !== memberId)
        throw new AppScopePermissionDeniedError();
      const configuration =
        action === 'preferences'
          ? readPersonalBoardPreferences({
              ...readPersonalBoardPreferences(existing.configuration),
              ...patch,
            })
          : readPersonalBoardPlan({
              ...readPersonalBoardPlan(existing.configuration),
              ...patch,
            });
      await client.mutation({
        updateTaskPersonalBoardState: {
          __args: { id, data: { configuration } },
          id: true,
        },
      });
      return action === 'preferences'
        ? { preferences: configuration }
        : { issueId, plan: configuration };
    }
    const visibleProjectIds = await listVisibleProjectIds({
      client,
      scope,
      operation: 'read',
    });
    const [projects, issueStatuses, preferences] = await Promise.all([
      visibleProjectIds?.length === 0
        ? Promise.resolve([])
        : listScopedRecords<ProjectRow>({
            client,
            pluralName: 'projects',
            filter: buildProjectScopeFilter(visibleProjectIds, 'id'),
            selection: { id: true, name: true, key: true, appId: true },
          }),
      visibleProjectIds?.length === 0
        ? Promise.resolve([])
        : listScopedRecords<IssueStatusRow>({
            client,
            pluralName: 'issueStatuses',
            filter: buildProjectScopeFilter(visibleProjectIds),
            selection: ISSUE_STATUS_SELECTION,
            orderBy: [{ position: 'AscNullsLast' }],
          }),
      readPersonalBoardPreferencesForMember(client, memberId),
    ]);
    const doneStatusIds = issueStatuses
      .filter((status) => status.category === 'DONE')
      .map((status) => status.id);
    const result =
      visibleProjectIds?.length === 0
        ? {}
        : await client.query({
            issues: {
              __args: {
                filter: {
                  ...buildProjectScopeFilter(visibleProjectIds),
                  assigneeId: { eq: memberId },
                  ...(doneStatusIds.length
                    ? {
                        or: [
                          { statusId: { is: 'NULL' } },
                          { not: { statusId: { in: doneStatusIds } } },
                          {
                            statusId: { in: doneStatusIds },
                            updatedAt: {
                              gte: new Date(
                                Date.now() - 7 * 86400000,
                              ).toISOString(),
                            },
                          },
                        ],
                      }
                    : {}),
                },
                first: TASK_PERSONAL_BOARD_PAGE_SIZE,
                orderBy: [{ dueDate: 'AscNullsLast' }, { id: 'AscNullsLast' }],
                ...(isNonEmptyString(event.body?.after)
                  ? { after: event.body.after }
                  : {}),
              },
              edges: { node: ISSUE_SEARCH_SELECTION },
              totalCount: true,
              pageInfo: { endCursor: true, hasNextPage: true },
            },
          });
    const connection = result.issues as
      | (Connection<IssueRow> & {
          totalCount?: number;
          pageInfo?: { endCursor?: string | null; hasNextPage?: boolean };
        })
      | undefined;
    const issues = (connection?.edges ?? []).map((edge) => edge.node);
    const states = issues.length
      ? await listScopedRecords<PersonalBoardStateRow>({
          client,
          pluralName: 'taskPersonalBoardStates',
          filter: {
            memberId: { eq: memberId },
            issueId: { in: issues.map((issue) => issue.id) },
          },
          selection: PERSONAL_BOARD_STATE_SELECTION,
        })
      : [];
    const payload: Omit<PersonalBoardData, 'success'> = {
      memberId,
      issues,
      projects: projects.map((project) => ({
        ...project,
        canWrite: hasAppGrant(scope, project.appId ?? null, 'write'),
      })),
      issueStatuses,
      preferences,
      plans: Object.fromEntries(
        states
          .filter((state) => isNonEmptyString(state.issueId))
          .map((state) => [
            state.issueId,
            readPersonalBoardPlan(state.configuration),
          ]),
      ),
      totalCount: connection?.totalCount ?? 0,
      endCursor: connection?.pageInfo?.endCursor ?? null,
      hasNextPage: connection?.pageInfo?.hasNextPage === true,
    };
    return payload;
  });

export default defineLogicFunction({
  universalIdentifier: TASK_PERSONAL_BOARD_LOGIC_FUNCTION_UID,
  name: 'task-personal-board',
  description:
    'Member-owned task planning across accessible projects and personal board preferences.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: TASK_PERSONAL_BOARD_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
