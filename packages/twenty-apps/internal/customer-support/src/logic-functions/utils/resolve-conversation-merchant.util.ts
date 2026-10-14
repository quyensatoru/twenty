import { type ApiClient } from '../../types/api-client';
import { type CrispConversationMeta } from '../../types/crisp-api';
import {
  extractContactEmails,
  extractShopDomains,
} from './extract-shop-domains.util';
import { matchMerchant } from './match-merchant.util';

// The merchant a chat belongs to, worked out afresh from what its session
// says. No match clears an earlier link: an older sync could pick another
// product's row for the same shop. The shop domain is kept when nothing new
// names one.
export const resolveConversationMerchant = async ({
  client,
  appName,
  meta,
}: {
  client: ApiClient;
  appName: string;
  meta: CrispConversationMeta | undefined;
}): Promise<{ merchantId: string | null; shopDomain?: string }> => {
  const shopDomains = extractShopDomains(meta);
  const match = await matchMerchant({
    client,
    appName,
    shopDomains,
    emails: extractContactEmails(meta),
  });

  if (match !== undefined) {
    return {
      merchantId: match.merchantId,
      ...(match.shopDomain === null ? {} : { shopDomain: match.shopDomain }),
    };
  }

  return {
    merchantId: null,
    ...(shopDomains.length > 0 ? { shopDomain: shopDomains[0] } : {}),
  };
};
