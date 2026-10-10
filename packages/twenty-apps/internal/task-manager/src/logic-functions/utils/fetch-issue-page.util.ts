import { attachDevelopmentSummaries } from './attach-development-summaries.util';
import { ISSUE_SEARCH_SELECTION } from '../../constants/record-selections';
import { type ApiClient } from '../../types/api-client';
import { type IssueRow } from '../../types/task-manager-rows';

export type IssuePage = {
  issues: IssueRow[];
  endCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
};

type IssuePageConnection = {
  edges?: { node: IssueRow }[];
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
  totalCount?: number;
};

// One page of a board column, with what the column needs to keep paging and
// to show its real size. The SEARCH selection, not the full one: a card never
// renders the rich text body, which would multiply the payload per row.
export const fetchIssuePage = async ({
  client,
  filter,
  first,
  after,
}: {
  client: ApiClient;
  filter: Record<string, unknown>;
  first: number;
  after?: string | null;
}): Promise<IssuePage> => {
  const result = await client.query({
    issues: {
      __args: {
        filter,
        first,
        orderBy: [{ position: 'AscNullsLast' }],
        ...(typeof after === 'string' && after !== '' ? { after } : {}),
      },
      edges: { node: ISSUE_SEARCH_SELECTION },
      pageInfo: { hasNextPage: true, endCursor: true },
      totalCount: true,
    },
  });

  const connection = result?.issues as IssuePageConnection | undefined;

  return {
    issues: await attachDevelopmentSummaries(
      client,
      (connection?.edges ?? []).map((edge) => edge.node),
    ),
    endCursor: connection?.pageInfo?.endCursor ?? null,
    hasNextPage: connection?.pageInfo?.hasNextPage === true,
    totalCount: connection?.totalCount ?? 0,
  };
};
