import { attachDevelopmentSummaries } from './attach-development-summaries.util';
import { type IssueOrderByEntry } from './build-board-issue-order-by.util';
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

// The backlog's manual rank, with the id as the tie break cursor paging needs.
const MANUAL_ISSUE_ORDER_BY: IssueOrderByEntry[] = [
  { position: 'AscNullsLast' },
  { id: 'AscNullsLast' },
];

// One page of a board column or backlog section, with what it needs to keep
// paging and to show its real size. The SEARCH selection, not the full one: a
// card never renders the rich text body, which would multiply the payload per
// row.
export const fetchIssuePage = async ({
  client,
  filter,
  first,
  after,
  orderBy = MANUAL_ISSUE_ORDER_BY,
}: {
  client: ApiClient;
  filter: Record<string, unknown>;
  first: number;
  after?: string | null;
  orderBy?: IssueOrderByEntry[];
}): Promise<IssuePage> => {
  const result = await client.query({
    issues: {
      __args: {
        filter,
        first,
        orderBy,
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
