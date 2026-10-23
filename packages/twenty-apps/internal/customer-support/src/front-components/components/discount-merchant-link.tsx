import { useState } from 'react';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';

import { DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH } from '../../constants/discount';
import { type MerchantSearchResult } from '../../types/discount';
import { openRecordInSidePanel } from '../utils/open-record-in-side-panel.util';
import { postAppRoute } from '../utils/post-app-route.util';
import { DISCOUNT_TOKENS, spacing } from './discount-theme';

type DiscountMerchantLinkProps = {
  shop: string;
  merchantId: string | null;
  appId: string | null;
};

const searchMerchantId = async (
  shop: string,
  appId: string | null,
): Promise<string | null> => {
  const result = await postAppRoute<MerchantSearchResult & { success: true }>(
    DISCOUNT_CONSOLE_SEARCH_MERCHANTS_ROUTE_PATH,
    { query: shop, appId },
  );

  return (
    result.merchants.find(
      (merchant) => merchant.name.toLowerCase() === shop.toLowerCase(),
    )?.id ?? null
  );
};

// Older discounts only name the shop, so the merchant is looked up by its
// domain: in the discount's app first, then in any app, since some merchant
// records were synced without their app.
const findMerchantId = async (
  shop: string,
  appId: string | null,
): Promise<string | null> =>
  (await searchMerchantId(shop, appId)) ??
  (appId === null ? null : await searchMerchantId(shop, null));

// A shop chip that opens the merchant's own record in Twenty's side panel.
export const DiscountMerchantLink = ({
  shop,
  merchantId,
  appId,
}: DiscountMerchantLinkProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const open = async () => {
    try {
      const id = merchantId ?? (await findMerchantId(shop, appId));

      if (id === null) {
        void enqueueSnackbar({
          message: t('{shop} is not a merchant in the CRM yet.', { shop }),
          variant: 'info',
        });
        return;
      }

      openRecordInSidePanel('merchant', id);
    } catch {
      void enqueueSnackbar({
        message: t('Could not open the merchant.'),
        variant: 'error',
      });
    }
  };

  return (
    <button
      type="button"
      title={t('Open merchant')}
      onClick={() => void open()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered
          ? DISCOUNT_TOKENS.backgroundSelected
          : DISCOUNT_TOKENS.backgroundTertiary,
        border: 'none',
        borderRadius: DISCOUNT_TOKENS.radiusSmall,
        color: isHovered ? 'var(--t-color-blue)' : DISCOUNT_TOKENS.textPrimary,
        cursor: 'pointer',
        display: 'inline-block',
        font: 'inherit',
        lineHeight: '20px',
        maxWidth: 220,
        overflow: 'hidden',
        padding: `0 ${spacing(2)}`,
        textOverflow: 'ellipsis',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
      }}
    >
      {shop}
    </button>
  );
};
