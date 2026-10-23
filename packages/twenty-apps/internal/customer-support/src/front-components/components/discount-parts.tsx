import { t } from 'twenty-sdk/front-component';

import { type DiscountListItem } from '../../types/discount';
import {
  formatDiscountValue,
  formatShortDay,
  isUnlimitedIntervals,
  readDiscountShop,
  readValidity,
} from '../utils/discount-display.util';
import { DISCOUNT_TOKENS, readAppColor, readColorScale, spacing } from './discount-theme';

export const AppBadge = ({ appName }: { appName: string | null }) => (
  <span
    style={{
      alignItems: 'center',
      color: DISCOUNT_TOKENS.textPrimary,
      display: 'inline-flex',
      fontWeight: DISCOUNT_TOKENS.fontWeightMedium,
      gap: spacing(1.5),
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        background: readColorScale(readAppColor(appName)).solid,
        borderRadius: 2,
        display: 'inline-block',
        height: 8,
        width: 8,
      }}
    />
    {appName ?? t('No app')}
  </span>
);

export const readIntervalsLabel = (limitInIntervals: number | null): string => {
  if (limitInIntervals === null) {
    return '';
  }

  if (isUnlimitedIntervals(limitInIntervals)) {
    return t('forever');
  }

  return limitInIntervals === 1
    ? t('1st cycle')
    : t('{count} cycles', { count: limitInIntervals });
};

export const readOfferLabel = (discount: DiscountListItem): string => {
  const value = formatDiscountValue(
    discount.discountType,
    discount.discountValue,
  );
  const intervals = readIntervalsLabel(discount.limitInIntervals);

  return intervals.length === 0 ? value : `${value} · ${intervals}`;
};

export const readTargetLabel = (discount: DiscountListItem): string => {
  if (discount.scope === 'ALL') {
    return t('All shops');
  }

  if (discount.scope === 'MULTI') {
    return t('{count} shops', { count: discount.assignedDomains.length });
  }

  return readDiscountShop(discount) ?? t('All shops');
};

export const readValidityLabel = (
  discount: DiscountListItem,
  today: string,
): string => {
  switch (readValidity(discount, today)) {
    case 'upcoming':
      return t('starts {day}', { day: formatShortDay(discount.startDate) });
    case 'expired':
      return t('expired');
    case 'open':
      return t('no end date');
    default:
      return discount.endDate === today ? t('ends today') : t('running');
  }
};

export const readPeriodLabel = (discount: DiscountListItem): string => {
  if (discount.startDate === null && discount.endDate === null) {
    return '—';
  }

  if (discount.endDate === null) {
    return t('from {day}', { day: formatShortDay(discount.startDate) });
  }

  return `${formatShortDay(discount.startDate)} → ${formatShortDay(discount.endDate)}`;
};


