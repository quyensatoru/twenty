import {
  type AppHealth,
  type BcIssueRecord,
  type BcReviewRecord,
  type MerchantRecord,
  type RelationshipStatus,
  type ReviewState,
  type SubscriptionLifecycle,
} from '../types/bc-records';

const HOUR_MS = 3_600_000;

export type LifecycleMerchant = Pick<MerchantRecord, 'using' | 'uninstalledAt'> & {
  // Set by callers that know the plan catalog; without it only install state
  // is known.
  lifecycle?: SubscriptionLifecycle;
};

export type LifecyclePlanInfo = {
  isTrial: boolean;
  monthlyPrice: number | null;
};

// Uninstalled from the install flag; Trial from the plan catalog; Cancelled
// when the app is still installed on a free plan after having paid, which is
// how a Shopify app looks once its subscription is cancelled.
export const readSubscriptionLifecycle = (
  merchant: Pick<MerchantRecord, 'using' | 'uninstalledAt'>,
  options: { plan?: LifecyclePlanInfo | null; hadPaidPlan?: boolean } = {},
): SubscriptionLifecycle => {
  if (merchant.using === false) {
    return 'UNINSTALLED';
  }

  if (options.plan?.isTrial === true) {
    return 'TRIAL';
  }

  if (options.plan?.monthlyPrice === 0 && options.hadPaidPlan === true) {
    return 'CANCELLED';
  }

  return 'ACTIVE';
};

// Trial and Active subscriptions are eligible for reviews and keep a client
// out of Inactive; Cancelled and Uninstalled are not.
export const isSubscriptionActive = (merchant: LifecycleMerchant): boolean =>
  merchant.lifecycle === undefined
    ? merchant.using !== false
    : merchant.lifecycle === 'TRIAL' || merchant.lifecycle === 'ACTIVE';

const issueAffectsApp = (
  issue: Pick<BcIssueRecord, 'appNames'>,
  appName: string,
): boolean =>
  (issue.appNames ?? []).some(
    (name) => name.toUpperCase() === appName.toUpperCase(),
  );

// Health follows issues, not billing: an uninstalled app has no health, an
// open issue naming the app marks it At Risk.
export const computeAppHealth = ({
  merchant,
  appName,
  openIssues,
}: {
  merchant: LifecycleMerchant;
  appName: string;
  openIssues: Pick<BcIssueRecord, 'appNames'>[];
}): AppHealth => {
  if (!isSubscriptionActive(merchant)) {
    return 'INACTIVE';
  }

  return openIssues.some((issue) => issueAffectsApp(issue, appName))
    ? 'AT_RISK'
    : 'HEALTHY';
};

// Reviews count per app: a review of another app never satisfies this one.
export const computeReviewState = ({
  merchant,
  appName,
  reviews,
}: {
  merchant: LifecycleMerchant;
  appName: string;
  reviews: Pick<BcReviewRecord, 'appName'>[];
}): ReviewState => {
  const hasReview = reviews.some(
    (review) => (review.appName ?? '').toUpperCase() === appName.toUpperCase(),
  );

  if (hasReview) {
    return 'REVIEWED';
  }

  return isSubscriptionActive(merchant) ? 'NEEDS_REVIEW' : 'NOT_ELIGIBLE';
};

// Precedence agreed with the BC team: an open issue wins over everything,
// then a client without any live app is Inactive, then a pending BC message
// is Waiting for Client until the no-reply window turns it into Follow-up.
export const computeRelationshipStatus = ({
  openIssueCount,
  merchants,
  awaitingReplySince,
  now,
  noReplyHours,
}: {
  openIssueCount: number;
  merchants: LifecycleMerchant[];
  awaitingReplySince: string | null;
  now: string;
  noReplyHours: number;
}): RelationshipStatus => {
  if (openIssueCount > 0) {
    return 'AT_RISK';
  }

  // A client not linked to any app install yet has no subscription to judge.
  if (merchants.length > 0 && !merchants.some(isSubscriptionActive)) {
    return 'INACTIVE';
  }

  if (awaitingReplySince !== null) {
    const elapsedMs = Date.parse(now) - Date.parse(awaitingReplySince);

    return elapsedMs >= noReplyHours * HOUR_MS
      ? 'FOLLOW_UP'
      : 'WAITING_FOR_CLIENT';
  }

  return 'ACTIVE';
};
