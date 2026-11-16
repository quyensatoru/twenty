import { type BcPlanRecord } from '../types/bc-records';

export type PlanCatalogEntry = Pick<
  BcPlanRecord,
  'appName' | 'planCode' | 'monthlyPrice' | 'rank'
>;

const sameCode = (left: string | null, right: string | null): boolean =>
  (left ?? '').trim().toUpperCase() === (right ?? '').trim().toUpperCase();

export const findPlan = (
  plans: PlanCatalogEntry[],
  appName: string | null,
  planCode: string | null,
): PlanCatalogEntry | undefined =>
  planCode === null || planCode.length === 0
    ? undefined
    : plans.find(
        (plan) => sameCode(plan.appName, appName) && sameCode(plan.planCode, planCode),
      );

const isKnownNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// Rank decides when the catalog has it for both plans, price otherwise. A
// change neither can order is left unclassified rather than guessed.
export const classifyPlanChange = ({
  plans,
  appName,
  oldPlan,
  newPlan,
}: {
  plans: PlanCatalogEntry[];
  appName: string | null;
  oldPlan: string | null;
  newPlan: string | null;
}): 'UPGRADE' | 'DOWNGRADE' | null => {
  if (sameCode(oldPlan, newPlan)) {
    return null;
  }

  const before = findPlan(plans, appName, oldPlan);
  const after = findPlan(plans, appName, newPlan);

  if (isKnownNumber(before?.rank) && isKnownNumber(after?.rank) && before.rank !== after.rank) {
    return after.rank > before.rank ? 'UPGRADE' : 'DOWNGRADE';
  }

  if (
    isKnownNumber(before?.monthlyPrice) &&
    isKnownNumber(after?.monthlyPrice) &&
    before.monthlyPrice !== after.monthlyPrice
  ) {
    return after.monthlyPrice > before.monthlyPrice ? 'UPGRADE' : 'DOWNGRADE';
  }

  return null;
};

// Null when either price is missing: an unknown is never reported as zero.
export const computeMrrDelta = ({
  plans,
  appName,
  oldPlan,
  newPlan,
}: {
  plans: PlanCatalogEntry[];
  appName: string | null;
  oldPlan: string | null;
  newPlan: string | null;
}): number | null => {
  const beforePrice =
    oldPlan === null ? 0 : findPlan(plans, appName, oldPlan)?.monthlyPrice;
  const afterPrice =
    newPlan === null ? 0 : findPlan(plans, appName, newPlan)?.monthlyPrice;

  return isKnownNumber(beforePrice) && isKnownNumber(afterPrice)
    ? afterPrice - beforePrice
    : null;
};
