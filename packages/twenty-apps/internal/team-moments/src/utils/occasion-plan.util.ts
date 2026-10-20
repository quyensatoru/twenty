import {
  type GiftContribution,
  type OccasionPlanRow,
  type RsvpStatus,
} from '../types/moments-records';

const VIETQR_IMAGE_BASE_URL = 'https://img.vietqr.io/image';
const VIETQR_ADD_INFO_MAX_LENGTH = 50;

export const buildVietQrImageUrl = ({
  bankCode,
  accountNumber,
  accountName,
  amount,
  note,
}: {
  bankCode: string;
  accountNumber: string;
  accountName: string | null;
  amount: number | null;
  note: string;
}): string => {
  const query = new URLSearchParams();

  if (amount !== null && amount > 0) {
    query.set('amount', String(Math.round(amount)));
  }

  // Bank apps truncate or reject long transfer notes.
  query.set('addInfo', note.slice(0, VIETQR_ADD_INFO_MAX_LENGTH));

  if (accountName !== null && accountName.trim().length > 0) {
    query.set('accountName', accountName.trim());
  }

  return `${VIETQR_IMAGE_BASE_URL}/${encodeURIComponent(bankCode.trim().toUpperCase())}-${encodeURIComponent(accountNumber.replace(/\s+/g, ''))}-compact2.png?${query.toString()}`;
};

export const sumContributions = (contributions: GiftContribution[] | null): number =>
  (contributions ?? []).reduce((total, contribution) => total + (Number.isFinite(contribution.amount) ? contribution.amount : 0), 0);

export const upsertContribution = (
  contributions: GiftContribution[] | null,
  contribution: GiftContribution,
): GiftContribution[] => [
  ...(contributions ?? []).filter((existing) => existing.memberId !== contribution.memberId),
  contribution,
];

export const countRsvps = (rsvps: OccasionPlanRow['rsvps']): Record<RsvpStatus, number> => {
  const counts: Record<RsvpStatus, number> = { GOING: 0, MAYBE: 0, NO: 0 };

  for (const status of Object.values(rsvps ?? {})) {
    if (status in counts) {
      counts[status] += 1;
    }
  }

  return counts;
};

export const formatVnd = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`;

// "640k", "1,2tr": the short form people use when talking about a gift fund.
export const formatVndShort = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(amount / 1_000_000)}tr`;
  }

  if (amount >= 1000) {
    return `${Math.round(amount / 1000)}k`;
  }

  return formatVnd(amount);
};

export const parseVndInput = (value: string): number | null => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  // Only a k/tr suffix makes the separator a decimal point ("1,5tr"); without
  // one, "200.000" is Vietnamese thousands grouping.
  const match = /^(\d+(?:[.,]\d+)?)(k|tr|m)$/.exec(normalized.replace(/đ$/, ''));

  if (match !== null) {
    const base = Number(match[1].replace(',', '.'));
    const multiplier = match[2] === 'k' ? 1000 : 1_000_000;

    return Number.isFinite(base) && base > 0 ? Math.round(base * multiplier) : null;
  }

  const digits = normalized.replace(/[.,đ]/g, '');

  return /^\d+$/.test(digits) && Number(digits) > 0 ? Number(digits) : null;
};
