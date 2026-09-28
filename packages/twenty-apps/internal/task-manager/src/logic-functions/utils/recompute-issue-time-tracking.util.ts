import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { computeRemainingEstimateMinutes } from '../../utils/compute-remaining-estimate-minutes.util';

const WORKLOG_PAGE_SIZE = 200;

// Port of the fork's worklog post-query hook: after any worklog write, the
// owning issue's timeSpentMinutes is the sum of its worklogs and its
// remainingEstimateMinutes is derived from that.
//
// The fork summed with SQL; an app pages the worklogs and sums in TypeScript.
export const recomputeIssueTimeTracking = async ({
  client,
  issueIds,
}: {
  client: ApiClient;
  issueIds: readonly (string | null | undefined)[];
}): Promise<void> => {
  const distinctIssueIds = [
    ...new Set(
      issueIds.filter((issueId): issueId is string => typeof issueId === 'string'),
    ),
  ];

  for (const issueId of distinctIssueIds) {
    const timeSpentMinutes = await sumWorklogMinutes({ client, issueId });

    const issueResult = await client.query({
      issues: {
        __args: { filter: { id: { eq: issueId } }, first: 1 },
        edges: { node: { id: true, originalEstimateMinutes: true } },
      },
    });

    const issueConnection = issueResult?.issues as
      | Connection<{ id: string; originalEstimateMinutes?: number | null }>
      | undefined;
    const issue = issueConnection?.edges?.[0]?.node;

    if (issue === undefined) {
      continue;
    }

    await client.mutation({
      updateIssue: {
        __args: {
          id: issueId,
          data: {
            timeSpentMinutes,
            remainingEstimateMinutes: computeRemainingEstimateMinutes({
              originalEstimateMinutes: issue.originalEstimateMinutes,
              timeSpentMinutes,
            }),
          },
        },
        id: true,
      },
    });
  }
};

const sumWorklogMinutes = async ({
  client,
  issueId,
}: {
  client: ApiClient;
  issueId: string;
}): Promise<number> => {
  let total = 0;
  let after: string | undefined;

  for (;;) {
    const result = await client.query({
      worklogs: {
        __args: {
          filter: { issueId: { eq: issueId } },
          first: WORKLOG_PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: { cursor: true, node: { id: true, timeSpentMinutes: true } },
      },
    });

    const connection = result?.worklogs as
      | {
          edges?: {
            cursor?: string;
            node: { id: string; timeSpentMinutes?: number | null };
          }[];
        }
      | undefined;
    const edges = connection?.edges ?? [];

    for (const edge of edges) {
      total += edge.node.timeSpentMinutes ?? 0;
    }

    if (edges.length < WORKLOG_PAGE_SIZE) {
      return total;
    }

    after = edges[edges.length - 1]?.cursor;

    if (after === undefined) {
      return total;
    }
  }
};
