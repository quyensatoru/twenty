import { type ApolloClient } from '@apollo/client';
import { isNonEmptyString } from '@sniptt/guards';
import gql from 'graphql-tag';
import { isNonEmptyArray } from 'twenty-shared/utils';

const SEARCH_MERCHANTS_BY_APP_ID_QUERY = gql`
  query SearchMerchantsByAppId(
    $filter: MerchantFilterInput
    $first: Int
    $after: String
  ) {
    merchants(filter: $filter, first: $first, after: $after) {
      edges {
        node {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export type MerchantSearchRecord = { id: string; name: string };

type MerchantsQueryResult = {
  merchants: {
    edges: { node: MerchantSearchRecord }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

// Queries the merchant object directly, scoped by its indexed appId column,
// instead of crawling every merchant in the app client-side to build an
// id-in-list filter (the previous approach — see
// useTaskManagerRelationTargetAppScopeFilter — took ~30 sequential round
// trips and a multi-thousand-UUID filter on a 30k-merchant app).
export const searchMerchantsByAppId = async ({
  apolloClient,
  appId,
  searchFilter,
  excludeIds,
  onlyIds,
  first,
  after = null,
}: {
  apolloClient: ApolloClient;
  appId: string;
  searchFilter: string;
  excludeIds?: string[];
  onlyIds?: string[];
  first: number;
  after?: string | null;
}): Promise<{
  records: MerchantSearchRecord[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}> => {
  const conditions: Record<string, unknown>[] = [{ appId: { eq: appId } }];

  if (isNonEmptyString(searchFilter)) {
    conditions.push({ name: { ilike: `%${searchFilter}%` } });
  }

  if (isNonEmptyArray(onlyIds)) {
    conditions.push({ id: { in: onlyIds } });
  } else if (isNonEmptyArray(excludeIds)) {
    conditions.push({ not: { id: { in: excludeIds } } });
  }

  const filter = conditions.length === 1 ? conditions[0] : { and: conditions };

  const { data } = await apolloClient.query<MerchantsQueryResult>({
    query: SEARCH_MERCHANTS_BY_APP_ID_QUERY,
    variables: { filter, first, after },
  });

  return {
    records: (data?.merchants?.edges ?? []).map((edge) => edge.node),
    pageInfo: data?.merchants?.pageInfo ?? {
      hasNextPage: false,
      endCursor: null,
    },
  };
};
