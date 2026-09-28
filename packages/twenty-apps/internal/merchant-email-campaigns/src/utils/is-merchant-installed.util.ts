import { type MerchantRow } from '../types/merchant-row';

// Null means the sync never wrote the flag, which is not an uninstall. Same
// rule as bd-prospects, so both apps agree on who is installed.
export const isMerchantInstalled = (
  merchant: Pick<MerchantRow, 'using'>,
): boolean => merchant.using !== false;
