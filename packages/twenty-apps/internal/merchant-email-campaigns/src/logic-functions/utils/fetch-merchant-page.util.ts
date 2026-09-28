import { type ApiClient } from '../../types/api-client';
import { type AudienceFilter } from '../../types/audience-filter';
import { type Connection } from '../../types/connection';
import { type MerchantRow } from '../../types/merchant-row';
import { buildMerchantGraphqlFilter } from '../../utils/build-merchant-graphql-filter.util';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { resolveMerchantSelection } from './resolve-merchant-selection.util';

export const fetchMerchantPage = async ({
  client,
  audienceFilter,
  first,
  after,
  selection,
}: {
  client: ApiClient;
  audienceFilter: AudienceFilter;
  first: number;
  after?: string;
  selection?: Record<string, unknown>;
}): Promise<Connection<MerchantRow>> => {
  const nodeSelection = selection ?? (await resolveMerchantSelection(client));
  const { merchants } = await executeWithRetry<{
    merchants: Connection<MerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: {
          filter: buildMerchantGraphqlFilter(audienceFilter),
          orderBy: [{ createdAt: 'AscNullsFirst' }],
          first,
          after,
        },
        totalCount: true,
        edges: { node: nodeSelection },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    }),
  );

  return merchants ?? {};
};
