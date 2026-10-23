import { type DiscountType } from '../../constants/discount';
import { type DiscountListItem } from '../../types/discount';
import { isForeverIntervals } from '../../utils/discount-rules.util';

export type DiscountValidity = 'upcoming' | 'active' | 'expired' | 'open';

// Dates are calendar days (DATE fields), compared as YYYY-MM-DD strings in the
// viewer's own day, which is how support reads "ends today".
export const toDayString = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
};

export const addDays = (day: string, days: number): string => {
  const [year, month, date] = day.split('-').map(Number);

  return toDayString(new Date(year, month - 1, date + days));
};

export const readValidity = (
  discount: Pick<DiscountListItem, 'startDate' | 'endDate'>,
  today: string,
): DiscountValidity => {
  if (discount.startDate !== null && discount.startDate > today) {
    return 'upcoming';
  }

  if (discount.endDate !== null && discount.endDate < today) {
    return 'expired';
  }

  return discount.endDate === null ? 'open' : 'active';
};

export const daysBetween = (fromDay: string, toDay: string): number => {
  const [fromYear, fromMonth, fromDate] = fromDay.split('-').map(Number);
  const [toYear, toMonth, toDate] = toDay.split('-').map(Number);

  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDate) -
      Date.UTC(fromYear, fromMonth - 1, fromDate)) /
      86_400_000,
  );
};

export const formatDiscountValue = (
  discountType: DiscountType | null,
  discountValue: number | null,
): string => {
  if (discountValue === null) {
    return '—';
  }

  const amount = Number.isInteger(discountValue)
    ? `${discountValue}`
    : discountValue.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

  return discountType === 'FIX_AMOUNT' ? `$${amount}` : `${amount}%`;
};

export const formatShortDay = (day: string | null): string => {
  if (day === null) {
    return '';
  }

  const [year, month, date] = day.split('-');
  const currentYear = `${new Date().getFullYear()}`;

  return year === currentYear
    ? `${date}/${month}`
    : `${date}/${month}/${year}`;
};

export const isUnlimitedIntervals = isForeverIntervals;

// Share of the validity window already behind us, for the progress bar.
export const readElapsedShare = (
  discount: Pick<DiscountListItem, 'startDate' | 'endDate'>,
  today: string,
): number | null => {
  if (discount.startDate === null || discount.endDate === null) {
    return null;
  }

  const total = daysBetween(discount.startDate, discount.endDate) + 1;
  const elapsed = daysBetween(discount.startDate, today) + 1;

  return total <= 0 ? null : Math.min(1, Math.max(0, elapsed / total));
};

export type DiscountFilter = {
  appName: string | null;
  validity: DiscountValidity | null;
  attention: boolean;
  search: string;
};

export const needsAttention = (discount: DiscountListItem): boolean =>
  discount.syncStatus === 'REJECTED' || discount.syncStatus === 'FAILED';

export const filterDiscounts = (
  discounts: DiscountListItem[],
  filter: DiscountFilter,
  today: string,
): DiscountListItem[] => {
  const search = filter.search.trim().toLowerCase();

  return discounts.filter((discount) => {
    if (filter.appName !== null && discount.appName !== filter.appName) {
      return false;
    }

    if (filter.attention && !needsAttention(discount)) {
      return false;
    }

    if (filter.validity !== null) {
      const validity = readValidity(discount, today);
      const matches =
        filter.validity === 'active'
          ? validity === 'active' || validity === 'open'
          : validity === filter.validity;

      if (!matches) {
        return false;
      }
    }

    if (search.length === 0) {
      return true;
    }

    return [
      discount.discountCode,
      discount.merchantName,
      discount.name,
      discount.reason,
      ...discount.assignedDomains,
    ].some(
      (value) =>
        typeof value === 'string' && value.toLowerCase().includes(search),
    );
  });
};

// The shop a discount is for, read from what older records filled in: the
// merchant, else the first assigned domain, else a name that is a domain.
export const readDiscountShop = (discount: DiscountListItem): string | null => {
  if (discount.merchantName !== null) {
    return discount.merchantName;
  }

  if (discount.assignedDomains.length > 0) {
    return discount.assignedDomains[0];
  }

  return discount.name !== null && /\.myshopify\.com$/.test(discount.name)
    ? discount.name
    : null;
};
