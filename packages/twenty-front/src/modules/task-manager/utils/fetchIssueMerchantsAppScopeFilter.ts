import { type ApolloClient } from '@apollo/client';
import gql from 'graphql-tag';
import { isDefined } from 'twenty-shared/utils';

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

// The inline/table-cell junction picker (useOpenJunctionRelationFieldInput)
// opens from a plain callback, not a mounted component, so it can't call the
// reactive useTaskManagerRelationTargetAppScopeFilter hook. This performs the
// same Issue -> Project -> App lookup as a one-shot query instead, scoped
// exclusively to the Issue.merchants junction field. The returned appId is
// used to search the merchant object directly (see searchMerchantsByAppId)
// rather than crawling every merchant id for the app client-side.
export const fetchIssueMerchantsAppScopeFilter = async ({
  apolloClient,
  issueId,
}: {
  apolloClient: ApolloClient;
  issueId: string;
}): Promise<string | undefined> => {
  const { data: issueData } = await apolloClient.query<{
    issue: { id: string; project: { id: string; appId: string | null } } | null;
  }>({
    query: GET_ISSUE_PROJECT_APP_ID,
    variables: { issueId },
  });

  const appId = issueData?.issue?.project?.appId;

  return isDefined(appId) ? appId : undefined;
};
