import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type MerchantRow } from '../../types/merchant-row';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { resolveMerchantSelection } from './resolve-merchant-selection.util';

export const fetchMerchant = async (
  client: ApiClient,
  merchantId: string,
): Promise<MerchantRow | null> => {
  const selection = await resolveMerchantSelection(client);
  const { merchants } = await executeWithRetry<{
    merchants: Connection<MerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: { filter: { id: { eq: merchantId } }, first: 1 },
        edges: { node: selection },
      },
    }),
  );

  return merchants?.edges?.[0]?.node ?? null;
};
