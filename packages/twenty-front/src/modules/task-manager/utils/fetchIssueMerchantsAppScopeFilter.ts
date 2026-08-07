import { idsToFilter } from '@/task-manager/hooks/useTaskManagerRelationTargetAppScopeFilter';
import { type ApolloClient } from '@apollo/client';
import gql from 'graphql-tag';
import { isDefined } from 'twenty-shared/utils';
import { type ObjectRecordFilterInput } from '~/generated/graphql';

// A project's app can have tens of thousands of merchants, so this must
// page through all of them rather than cap at one page.
const MERCHANT_SCOPE_PAGE_SIZE = 1000;

const GET_ISSUE_PROJECT_APP_ID = gql`
  query GetIssueProjectAppIdForMerchantScope($issueId: UUID!) {
    issue(filter: { id: { eq: $issueId } }) {
      id
      project {
        id
        appId
      }
    }
  }
`;

const GET_MERCHANT_IDS_BY_APP = gql`
  query GetMerchantIdsByAppForScope(
    $appId: UUID!
    $first: Int
    $after: String
  ) {
    merchants(filter: { appId: { eq: $appId } }, first: $first, after: $after) {
      edges {
        node {
          id
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// The inline/table-cell junction picker (useOpenJunctionRelationFieldInput)
// opens from a plain callback, not a mounted component, so it can't call the
// reactive useTaskManagerRelationTargetAppScopeFilter hook. This performs the
// same Issue -> Project -> App -> Merchants lookup as a one-shot query instead,
// scoped exclusively to the Issue.merchants junction field.
export const fetchIssueMerchantsAppScopeFilter = async ({
  apolloClient,
  issueId,
}: {
  apolloClient: ApolloClient;
  issueId: string;
}): Promise<ObjectRecordFilterInput | undefined> => {
  const { data: issueData } = await apolloClient.query<{
    issue: { id: string; project: { id: string; appId: string | null } } | null;
  }>({
    query: GET_ISSUE_PROJECT_APP_ID,
    variables: { issueId },
  });

  const appId = issueData?.issue?.project?.appId;

  if (!isDefined(appId)) {
    return undefined;
  }

  const merchantIds: string[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const { data: merchantsData } = await apolloClient.query<{
      merchants: {
        edges: { node: { id: string } }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>({
      query: GET_MERCHANT_IDS_BY_APP,
      variables: { appId, first: MERCHANT_SCOPE_PAGE_SIZE, after },
    });

    merchantIds.push(
      ...(merchantsData?.merchants?.edges ?? []).map((edge) => edge.node.id),
    );

    hasNextPage = merchantsData?.merchants?.pageInfo?.hasNextPage ?? false;
    after = merchantsData?.merchants?.pageInfo?.endCursor ?? null;
  }

  return idsToFilter(merchantIds);
};
