import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { RANK_ISSUE_ROUTE_PATH } from '../constants/route-paths';
import { RANK_ISSUE_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type Connection } from '../types/connection';
import {
  computeRankPosition,
  type RankSide,
} from '../utils/compute-rank-position.util';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { buildRankSectionFilter } from './utils/build-rank-section-filter.util';
import { fetchSprint } from './utils/fetch-sprint.util';
import { listScopedRecords } from './utils/list-scoped-records.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type RankIssueBody = {
  issueId?: string;
  // The section it lands in: a sprint, or the backlog (null).
  sprintId?: string | null;
  // The issue it was dropped below or above. Neither = end of the section.
  afterIssueId?: string;
  beforeIssueId?: string;
};

type RankedIssue = {
  id: string;
  projectId?: string | null;
  sprintId?: string | null;
  parentId?: string | null;
  position?: number | null;
};

const fetchRankedIssue = async (
  client: ApiClient,
  issueId: string,
): Promise<RankedIssue | null> => {
  const result = await client.query({
    issues: {
      __args: { filter: { id: { eq: issueId } }, first: 1 },
      edges: {
        node: {
          id: true,
          projectId: true,
          sprintId: true,
          parentId: true,
          position: true,
        },
      },
    },
  });

  return (
    (result?.issues as Connection<RankedIssue> | undefined)?.edges?.[0]?.node ??
    null
  );
};

const fetchNeighborPosition = async ({
  client,
  sectionFilter,
  anchorPosition,
  side,
}: {
  client: ApiClient;
  sectionFilter: Record<string, unknown>;
  anchorPosition: number;
  side: RankSide;
}): Promise<number | null> => {
  const result = await client.query({
    issues: {
      __args: {
        filter: {
          ...sectionFilter,
          position:
            side === 'after' ? { gt: anchorPosition } : { lt: anchorPosition },
        },
        first: 1,
        orderBy: [
          { position: side === 'after' ? 'AscNullsLast' : 'DescNullsLast' },
        ],
      },
      edges: { node: { id: true, position: true } },
    },
  });
  const position = (
    result?.issues as Connection<{ position?: number | null }> | undefined
  )?.edges?.[0]?.node.position;

  return typeof position === 'number' ? position : null;
};

// Places an issue in a backlog section next to the one it was dropped on,
// reading the real neighbours at write time: the screen may hold only the
// section's first page, or be stale after someone else's move. An anchor that
// is no longer in the section sends the issue to the end instead of failing.
// A move to another sprint takes the issue's subtasks along, as in Jira.
const handler = async (event: RoutePayload<RankIssueBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');
    const targetSprintId =
      typeof event.body?.sprintId === 'string' ? event.body.sprintId : null;

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'write',
    });

    const issue = await fetchRankedIssue(client, issueId);

    if (issue === null || typeof issue.projectId !== 'string') {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (typeof issue.parentId === 'string') {
      throw new Error('A subtask follows its parent. Move the parent instead.');
    }

    const projectId = issue.projectId;

    if (targetSprintId !== null) {
      const sprint = await fetchSprint(client, targetSprintId);

      if (
        sprint === null ||
        sprint.projectId !== projectId ||
        sprint.state === 'CLOSED'
      ) {
        throw new Error('Pick an open sprint of the same project.');
      }
    }

    const sectionFilter = buildRankSectionFilter({
      projectId,
      sprintId: targetSprintId,
      excludedIssueId: issueId,
    });
    const anchorIssueId =
      typeof event.body?.afterIssueId === 'string'
        ? event.body.afterIssueId
        : typeof event.body?.beforeIssueId === 'string'
          ? event.body.beforeIssueId
          : null;
    const side: RankSide =
      typeof event.body?.afterIssueId === 'string' ? 'after' : 'before';
    const anchor =
      anchorIssueId === null || anchorIssueId === issueId
        ? null
        : await fetchRankedIssue(client, anchorIssueId);
    const isAnchorInSection =
      anchor !== null &&
      anchor.projectId === projectId &&
      typeof anchor.parentId !== 'string' &&
      (anchor.sprintId ?? null) === targetSprintId &&
      typeof anchor.position === 'number';

    const position: number | 'last' =
      isAnchorInSection && typeof anchor.position === 'number'
        ? computeRankPosition({
            anchorPosition: anchor.position,
            neighborPosition: await fetchNeighborPosition({
              client,
              sectionFilter,
              anchorPosition: anchor.position,
              side,
            }),
            side,
          })
        : 'last';

    await client.mutation({
      updateIssue: {
        __args: { id: issueId, data: { sprintId: targetSprintId, position } },
        id: true,
      },
    });

    if ((issue.sprintId ?? null) !== targetSprintId) {
      const subtasks = await listScopedRecords<{ id: string }>({
        client,
        pluralName: 'issues',
        filter: { parentId: { eq: issueId } },
        selection: { id: true },
      });

      for (const subtask of subtasks) {
        await client.mutation({
          updateIssue: {
            __args: { id: subtask.id, data: { sprintId: targetSprintId } },
            id: true,
          },
        });
      }
    }

    return { issueId, sprintId: targetSprintId };
  });

export default defineLogicFunction({
  universalIdentifier: RANK_ISSUE_LOGIC_FUNCTION_UID,
  name: 'rank-issue',
  description:
    'Route: moves a top-level issue within or between backlog sections, ranking it next to the issue it was dropped on.',
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: RANK_ISSUE_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
