import { type ApiClient } from '../../types/api-client';
import { type InboundEvent } from '../../types/inbound-event';
import { type MerchantRow } from '../../types/merchant-row';
import { buildEventContactUpdate } from '../../utils/build-event-contact-update.util';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

// Written before any email is queued, so the send job reads the new address.
// Returns the rows as they are after the update.
export const applyEventContact = async ({
  client,
  event,
  merchants,
}: {
  client: ApiClient;
  event: InboundEvent;
  merchants: MerchantRow[];
}): Promise<MerchantRow[]> => {
  const updated: MerchantRow[] = [];

  for (const merchant of merchants) {
    const update = buildEventContactUpdate(merchant, event);

    if (update !== null) {
      await executeWithRetry(() =>
        client.mutation({
          updateMerchant: {
            __args: { id: merchant.id, data: update },
            id: true,
          },
        }),
      );
    }

    updated.push({ ...merchant, ...(update ?? {}) } as MerchantRow);
  }

  return updated;
};
