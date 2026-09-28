import { type MerchantRow } from '../types/merchant-row';

export const readMerchantEmail = (merchant: MerchantRow): string | null => {
  const email = merchant.email?.primaryEmail?.trim().toLowerCase();

  return email === undefined || email === '' ? null : email;
};
