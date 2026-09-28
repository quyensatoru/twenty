import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { type InboundEvent } from '../../types/inbound-event';
import { type MerchantRow } from '../../types/merchant-row';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { resolveMerchantSelection } from './resolve-merchant-selection.util';

const MAX_ROWS_PER_SHOP = 50;

// By domain first: it is the shop's identity here, while an email can be
// shared by several shops of one owner. Email is the fallback for senders
// that know nothing but the address.
export const findMerchantsForEvent = async (
  client: ApiClient,
  event: Pick<InboundEvent, 'domain' | 'email'>,
): Promise<MerchantRow[]> => {
  const selection = await resolveMerchantSelection(client);
  const filter =
    event.domain !== null
      ? { name: { ilike: event.domain } }
      : { email: { primaryEmail: { ilike: event.email } } };
  const { merchants } = await executeWithRetry<{
    merchants: Connection<MerchantRow>;
  }>(() =>
    client.query({
      merchants: {
        __args: { filter, first: MAX_ROWS_PER_SHOP },
        edges: { node: selection },
      },
    }),
  );

  return (merchants?.edges ?? []).map((edge) => edge.node);
};
