// Events arrive with whatever the sender had: `https://Shop.myshopify.com/`,
// `shop.myshopify.com`, ... Merchant names are stored bare and lowercase.
export const normalizeShopDomain = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const domain = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  return domain === '' ? null : domain;
};
