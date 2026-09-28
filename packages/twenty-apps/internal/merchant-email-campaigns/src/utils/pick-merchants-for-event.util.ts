import { type InboundEvent } from '../types/inbound-event';
import { type MerchantRow } from '../types/merchant-row';

// A shop has one merchant row per app. When the event names its app only that
// row is kept; otherwise every row of the shop is a candidate and each
// campaign's own audience filter decides which one it mails.
export const pickMerchantsForEvent = (
  merchants: MerchantRow[],
  event: Pick<InboundEvent, 'appName'>,
): MerchantRow[] => {
  if (event.appName === null) {
    return merchants;
  }

  const appName = event.appName.toLowerCase();

  return merchants.filter(
    (merchant) => merchant.app?.name?.toLowerCase() === appName,
  );
};
