import {
  type DiscountScope,
  type DiscountType,
  FOREVER_INTERVALS,
} from '../constants/discount';

// Shared by the Discounts page (instant feedback) and the save route (the
// check that counts), so both reject the same input.

export type DiscountDraft = {
  appId: string | null;
  appName: string | null;
  scope: DiscountScope;
  merchantId: string | null;
  merchantDomain: string | null;
  assignedDomains: string[];
  discountType: DiscountType;
  discountValue: number | null;
  limitInIntervals: number | null;
  limitUsage: number | null;
  startDate: string | null;
  endDate: string | null;
  discountCode: string;
  reason: string;
  status: boolean;
};

export type DiscountDraftField =
  | 'appId'
  | 'merchantId'
  | 'assignedDomains'
  | 'discountValue'
  | 'limitInIntervals'
  | 'limitUsage'
  | 'endDate'
  | 'discountCode';

export type DiscountRuleCode =
  | 'required'
  | 'not_positive'
  | 'over_hundred_percent'
  | 'not_whole'
  | 'end_before_start'
  | 'code_format'
  | 'domain_format'
  | 'too_many_domains';

export type DiscountRuleError = {
  field: DiscountDraftField;
  code: DiscountRuleCode;
};

export type DiscountRuleWarning = 'app_ignores_assigned_domains';

const DISCOUNT_CODE_PATTERN = /^[A-Z0-9_-]{3,40}$/;
const SHOP_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/;
const MAX_ASSIGNED_DOMAINS = 20;

// BLOY tracks which shops used a code but cannot yet limit a code to shops.
const APPS_IGNORING_ASSIGNED_DOMAINS = new Set(['BLOY']);

// Uppercase and no whitespace anywhere: a code typed with a trailing tab
// (seen in production) never matched on the merchant's side.
export const normalizeDiscountCode = (code: string): string =>
  code.replace(/\s+/g, '').toUpperCase();

export const normalizeShopDomain = (domain: string): string =>
  domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

export const isForeverIntervals = (limitInIntervals: number | null): boolean =>
  limitInIntervals !== null && limitInIntervals >= FOREVER_INTERVALS;

const isWhole = (value: number): boolean => Number.isInteger(value);

// Domains the app receives in `assignedDomains` for the chosen scope.
export const resolveAssignedDomains = (draft: DiscountDraft): string[] => {
  if (draft.scope === 'SINGLE') {
    return draft.merchantDomain === null ? [] : [draft.merchantDomain];
  }

  if (draft.scope === 'MULTI') {
    return [
      ...new Set(
        draft.assignedDomains
          .map(normalizeShopDomain)
          .filter((domain) => domain.length > 0),
      ),
    ];
  }

  return [];
};

export const validateDiscountDraft = (
  draft: DiscountDraft,
): DiscountRuleError[] => {
  const errors: DiscountRuleError[] = [];
  const add = (field: DiscountDraftField, code: DiscountRuleCode) =>
    errors.push({ field, code });

  if (draft.appId === null) {
    add('appId', 'required');
  }

  if (draft.scope === 'SINGLE' && draft.merchantId === null) {
    add('merchantId', 'required');
  }

  if (draft.scope === 'MULTI') {
    const domains = resolveAssignedDomains(draft);

    if (domains.length === 0) {
      add('assignedDomains', 'required');
    } else if (domains.length > MAX_ASSIGNED_DOMAINS) {
      add('assignedDomains', 'too_many_domains');
    } else if (domains.some((domain) => !SHOP_DOMAIN_PATTERN.test(domain))) {
      add('assignedDomains', 'domain_format');
    }
  }

  if (draft.discountValue === null) {
    add('discountValue', 'required');
  } else if (draft.discountValue <= 0) {
    add('discountValue', 'not_positive');
  } else if (
    draft.discountType === 'PERCENTAGE' &&
    draft.discountValue > 100
  ) {
    add('discountValue', 'over_hundred_percent');
  }

  if (draft.limitInIntervals === null) {
    add('limitInIntervals', 'required');
  } else if (draft.limitInIntervals < 1) {
    add('limitInIntervals', 'not_positive');
  } else if (!isWhole(draft.limitInIntervals)) {
    add('limitInIntervals', 'not_whole');
  }

  if (draft.limitUsage === null) {
    add('limitUsage', 'required');
  } else if (draft.limitUsage < 1) {
    add('limitUsage', 'not_positive');
  } else if (!isWhole(draft.limitUsage)) {
    add('limitUsage', 'not_whole');
  }

  if (draft.startDate === null || draft.endDate === null) {
    add('endDate', 'required');
  } else if (draft.endDate < draft.startDate) {
    add('endDate', 'end_before_start');
  }

  const code = normalizeDiscountCode(draft.discountCode);

  if (code.length === 0) {
    add('discountCode', 'required');
  } else if (!DISCOUNT_CODE_PATTERN.test(code)) {
    add('discountCode', 'code_format');
  }

  return errors;
};

export const listDiscountWarnings = (
  draft: DiscountDraft,
): DiscountRuleWarning[] =>
  draft.appName !== null &&
  APPS_IGNORING_ASSIGNED_DOMAINS.has(draft.appName) &&
  draft.scope !== 'ALL'
    ? ['app_ignores_assigned_domains']
    : [];

// e.g. MIDA25-AYSFI1: app, amount and the start of the shop's handle, so CSE
// can tell codes apart at a glance and two shops rarely collide.
export const suggestDiscountCode = ({
  appName,
  discountType,
  discountValue,
  merchantDomain,
}: {
  appName: string | null;
  discountType: DiscountType;
  discountValue: number | null;
  merchantDomain: string | null;
}): string => {
  const prefix = appName ?? 'CODE';
  const amount =
    discountValue === null
      ? ''
      : `${Math.round(discountValue)}${discountType === 'FIX_AMOUNT' ? 'USD' : ''}`;
  const shop = (merchantDomain ?? '')
    .split('.')[0]
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 6)
    .toUpperCase();

  return normalizeDiscountCode(
    [`${prefix}${amount}`, shop].filter((part) => part.length > 0).join('-'),
  );
};

// Shown in relation pickers and the record page title.
export const buildDiscountName = ({
  discountCode,
  scope,
  merchantDomain,
  assignedDomains,
}: {
  discountCode: string;
  scope: DiscountScope;
  merchantDomain: string | null;
  assignedDomains: string[];
}): string => {
  const target =
    scope === 'SINGLE'
      ? merchantDomain
      : scope === 'MULTI'
        ? `${assignedDomains.length} shops`
        : 'all shops';

  return target === null ? discountCode : `${discountCode} · ${target}`;
};
