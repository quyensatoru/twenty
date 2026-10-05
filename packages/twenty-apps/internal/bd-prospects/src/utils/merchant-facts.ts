import { type MerchantRow } from './api-types';

// Null means the workspace's sync has never written the flag, which is not the
// same as an uninstall, so only an explicit false counts as removed.
export const isAppInstalled = (merchant: MerchantRow): boolean =>
  merchant.using !== false;

export const collectInstalledAppKeys = (
  merchants: MerchantRow[],
  appKeyById: Map<string, string>,
): string[] =>
  merchants.flatMap((merchant) => {
    if (!isAppInstalled(merchant)) {
      return [];
    }

    const appKey =
      merchant.appId === null || merchant.appId === undefined
        ? undefined
        : appKeyById.get(merchant.appId);

    return appKey === undefined ? [] : [appKey];
  });

// The shop's contact address, taken from a merchant row of an app it still
// runs where possible: a row left behind by an uninstall years ago is the least
// likely to still reach anyone.
export const pickMerchantEmail = (
  merchants: MerchantRow[],
): string | null => {
  const readEmail = (merchant: MerchantRow): string | null => {
    const email = merchant.email?.primaryEmail?.trim();

    return email === undefined || email === '' ? null : email;
  };

  for (const merchant of merchants) {
    if (isAppInstalled(merchant)) {
      const email = readEmail(merchant);

      if (email !== null) {
        return email;
      }
    }
  }

  for (const merchant of merchants) {
    const email = readEmail(merchant);

    if (email !== null) {
      return email;
    }
  }

  return null;
};
