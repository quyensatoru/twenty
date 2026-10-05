import {
  MERCHANT_NON_PLAN_VALUES,
  MERCHANT_PLAN_ALIASES,
  SHOPIFY_PLAN_OPTIONS,
} from '../constants/shopify-plans';

const PLAN_RANK_BY_VALUE = new Map<string, number>(
  SHOPIFY_PLAN_OPTIONS.map((option, index) => [option.value as string, index]),
);

// Maps whatever an app wrote on the merchant row onto the value the prospect
// stores. Returns null for a row that carries an install state instead of a
// plan, so the caller can tell "no plan here" from "a plan we do not know".
export const normalizeMerchantPlan = (
  plan: string | null | undefined,
): string | null => {
  if (plan === null || plan === undefined) {
    return null;
  }

  const raw = plan.trim().toUpperCase();

  if (raw === '' || MERCHANT_NON_PLAN_VALUES.includes(raw)) {
    return null;
  }

  return MERCHANT_PLAN_ALIASES[raw] ?? 'OTHER';
};

// A shop holds one merchant row per app and they can disagree, both on plan and
// on spelling, so the prospect keeps the strongest plan any row reports. Null
// when no row reports one at all, which tells the caller to keep what is stored.
export const pickHighestPlan = (
  plans: (string | null | undefined)[],
): string | null => {
  let best: string | null = null;
  let bestRank = Number.MAX_SAFE_INTEGER;

  for (const plan of plans) {
    const normalizedPlan = normalizeMerchantPlan(plan);

    if (normalizedPlan === null) {
      continue;
    }

    const rank = PLAN_RANK_BY_VALUE.get(normalizedPlan) ?? Number.MAX_SAFE_INTEGER;

    if (rank < bestRank) {
      best = normalizedPlan;
      bestRank = rank;
    }
  }

  return best;
};

export const isHighValuePlan = (
  plan: string | null | undefined,
  highValuePlans: string[],
): boolean => {
  const normalizedPlan = normalizeMerchantPlan(plan);

  return normalizedPlan !== null && highValuePlans.includes(normalizedPlan);
};
