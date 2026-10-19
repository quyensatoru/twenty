import {
  CRISP_PLAN_DATA_UNINSTALLED_PLAN,
  getCrispPlanDataPlanKey,
  getCrispPlanDataPlanStartedAtKey,
} from '../../constants/crisp-plan-data';

export type PlanDataMerchant = {
  pricingPlan: string | null;
  planStartedAt: string | null;
  using: boolean | null;
};

export type CrispPlanData = Record<string, string>;

const buildAppPlanData = (
  appName: string,
  merchant: PlanDataMerchant,
): CrispPlanData | null => {
  if (merchant.using === false) {
    return {
      [getCrispPlanDataPlanKey(appName)]: CRISP_PLAN_DATA_UNINSTALLED_PLAN,
      [getCrispPlanDataPlanStartedAtKey(appName)]: '',
    };
  }

  // A merchant the app sync has not given a plan yet has nothing to say.
  if (merchant.pricingPlan === null || merchant.pricingPlan === '') {
    return null;
  }

  return {
    [getCrispPlanDataPlanKey(appName)]: merchant.pricingPlan,
    // A day is what the inbox filter compares on; the time adds nothing.
    [getCrispPlanDataPlanStartedAtKey(appName)]:
      merchant.planStartedAt?.slice(0, 10) ?? '',
  };
};

// Keyed by product: the shop's merchant row of each product the chat's
// website serves. Null when none of them has anything to write.
export const buildCrispPlanData = (
  merchantsByAppName: Map<string, PlanDataMerchant>,
): CrispPlanData | null => {
  const planData: CrispPlanData = {};

  for (const [appName, merchant] of merchantsByAppName) {
    Object.assign(planData, buildAppPlanData(appName, merchant) ?? {});
  }

  return Object.keys(planData).length === 0 ? null : planData;
};

export const hasCrispPlanData = (
  sessionData: Record<string, unknown> | null | undefined,
  planData: CrispPlanData,
): boolean =>
  Object.entries(planData).every(
    ([key, value]) => (sessionData ?? {})[key] === value,
  );

// Whether the plan clock has to restart now: a new plan starts on any change
// of pricingPlan, upgrades and downgrades included, and on a reinstall. An
// update that carries its own planStartedAt (the app's merchant sync knows
// the real date) is taken as is.
export const startsNewPlan = (
  before: Partial<PlanDataMerchant>,
  after: Partial<PlanDataMerchant>,
): boolean =>
  (before.planStartedAt ?? null) === (after.planStartedAt ?? null) &&
  ((before.pricingPlan ?? null) !== (after.pricingPlan ?? null) ||
    (before.using === false && after.using === true));
