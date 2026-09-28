import { type InboundEvent } from '../types/inbound-event';
import { type MerchantRow } from '../types/merchant-row';
import { readMerchantEmail } from './read-merchant-email.util';

// The sender is the system of record for the owner's address, so a different
// email replaces the stored one. A name only fills an empty field: the team
// may have corrected it by hand.
export const buildEventContactUpdate = (
  merchant: MerchantRow,
  event: Pick<InboundEvent, 'email' | 'contactName'>,
): Record<string, unknown> | null => {
  const update: Record<string, unknown> = {};

  if (event.email !== null && readMerchantEmail(merchant) !== event.email) {
    update.email = { primaryEmail: event.email };
  }

  if (event.contactName !== null && !merchant.contactName?.trim()) {
    update.contactName = event.contactName;
  }

  return Object.keys(update).length === 0 ? null : update;
};
