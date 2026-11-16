import {
  type AnalyticsMetricKey,
  type KpiValue,
  type ReportingPeriod,
} from '../types/analytics';
import {
  type BcPaymentRecord,
  type BcPlanRecord,
  type BcSubscriptionEventRecord,
  type MerchantRecord,
  type VipClientRecord,
} from '../types/bc-records';
import { isInPeriod } from './analytics-period.util';
import { isMerchantActiveAt } from './analytics-metrics.util';

export type MrrLine = {
  merchant: MerchantRecord;
  planCode: string;
  monthlyPrice: number;
};

export type MrrMovementKind = 'NEW' | 'EXPANSION' | 'CONTRACTION' | 'CHURNED';

export type MrrMovement = {
  event: BcSubscriptionEventRecord;
  kind: MrrMovementKind;
  // Always positive; contraction and churn are losses of this size.
  amount: number;
};

export type RevenueLine = {
  client: VipClientRecord;
  appNames: string[];
  // null: the payment feed has nothing for this client, never shown as 0.
  amount: number | null;
};

export type FinanceDataset = {
  period: ReportingPeriod;
  appName: string | null;
  portfolioClients: VipClientRecord[];
  merchants: MerchantRecord[];
  plans: BcPlanRecord[];
  // Every verified plan event before the period end, so a plan can be read
  // as of any instant; movements only use the ones inside the period.
  subscriptionEvents: BcSubscriptionEventRecord[];
  payments: BcPaymentRecord[];
  // Whether the payment feed has ever delivered anything, in any portfolio.
  hasAnyPayment: boolean;
};

export type FinanceComputation = {
  kpis: Partial<Record<AnalyticsMetricKey, KpiValue>>;
  mrrStatus: 'OK' | 'UNAVAILABLE';
  lifetimeStatus: 'OK' | 'UNAVAILABLE';
  unpricedSubscriptionCount: number;
  clientsWithPayments: number;
  mrrLines: MrrLine[];
  movements: MrrMovement[];
  revenueLines: RevenueLine[];
};

const planKey = (appName: string, planCode: string): string =>
  `${appName.toUpperCase()}:${planCode.toUpperCase()}`;

export const buildPlanPriceIndex = (
  plans: BcPlanRecord[],
): Map<string, number> =>
  new Map(
    plans.flatMap((plan) =>
      plan.appName !== null &&
      plan.planCode !== null &&
      typeof plan.monthlyPrice === 'number'
        ? [[planKey(plan.appName, plan.planCode), plan.monthlyPrice] as const]
        : [],
    ),
  );

const readTime = (value: string | null | undefined): number =>
  typeof value === 'string' && value.length > 0
    ? Date.parse(value)
    : Number.NaN;

const readPlanPrice = (
  appName: string | null | undefined,
  planCode: string | null | undefined,
  prices: Map<string, number>,
): number | undefined =>
  appName && planCode ? prices.get(planKey(appName, planCode)) : undefined;

// The merchant's plan at an instant: the last verified plan event before it,
// else the plan the first later event started from, else the current plan.
export const readPlanAt = (
  merchant: MerchantRecord,
  events: BcSubscriptionEventRecord[],
  instant: number,
): string | null => {
  const merchantEvents = events
    .filter(
      (event) =>
        event.isVerified &&
        event.merchantId === merchant.id &&
        !Number.isNaN(readTime(event.occurredAt)),
    )
    .sort(
      (left, right) => readTime(left.occurredAt) - readTime(right.occurredAt),
    );
  const before = merchantEvents.filter(
    (event) => readTime(event.occurredAt) < instant,
  );
  const lastBefore = [...before]
    .reverse()
    .find((event) => event.newPlan !== null);

  if (lastBefore !== undefined) {
    return lastBefore.newPlan;
  }

  const firstAfter = merchantEvents.find(
    (event) => readTime(event.occurredAt) >= instant && event.oldPlan !== null,
  );

  return firstAfter?.oldPlan ?? merchant.pricingPlan;
};

const sameApp = (left: string | null | undefined, right: string): boolean =>
  (left ?? '').toUpperCase() === right.toUpperCase();

const unavailable: KpiValue = { value: null, status: 'UNAVAILABLE' };

// Merchant-level convention (spec 7.1): money from a client paying for
// nothing yet is New, more money from a paying client is Expansion, less
// money from a client that keeps paying is Contraction, and losing its last
// paid subscription (downgrade to free included) is Churn.
export const classifyMrrMovement = ({
  event,
  clientMerchants,
  events,
  prices,
}: {
  event: BcSubscriptionEventRecord;
  clientMerchants: MerchantRecord[];
  events: BcSubscriptionEventRecord[];
  prices: Map<string, number>;
}): MrrMovement | null => {
  const delta = event.mrrDelta;

  if (typeof delta !== 'number' || delta === 0) {
    return null;
  }

  const eventTime = readTime(event.occurredAt);
  const hasOtherPaidApp = clientMerchants.some((merchant) => {
    if (
      merchant.id === event.merchantId ||
      !isMerchantActiveAt(merchant, eventTime)
    ) {
      return false;
    }

    return (
      (readPlanPrice(
        merchant.app?.name,
        readPlanAt(merchant, events, eventTime),
        prices,
      ) ?? 0) > 0
    );
  });
  const oldPrice =
    event.eventType === 'INSTALL' || event.eventType === 'REINSTALL'
      ? 0
      : readPlanPrice(event.appName, event.oldPlan, prices);
  const newPrice =
    event.eventType === 'UNINSTALL' || event.eventType === 'CANCEL'
      ? 0
      : readPlanPrice(event.appName, event.newPlan, prices);
  const resolvedOldPrice =
    oldPrice ?? (newPrice === undefined ? undefined : newPrice - delta);
  const resolvedNewPrice =
    newPrice ?? (oldPrice === undefined ? undefined : oldPrice + delta);

  if (delta > 0) {
    // Unknown old price on an upgrade: treat the app as already paid for.
    const wasPayingForApp = (resolvedOldPrice ?? 1) > 0;

    return {
      event,
      kind: hasOtherPaidApp || wasPayingForApp ? 'EXPANSION' : 'NEW',
      amount: delta,
    };
  }

  const keepsPayingForApp = (resolvedNewPrice ?? 1) > 0;

  return {
    event,
    kind: hasOtherPaidApp || keepsPayingForApp ? 'CONTRACTION' : 'CHURNED',
    amount: Math.abs(delta),
  };
};

// One invoice is one collection: a feed replaying it under another payment
// id must not count it twice.
export const dedupePayments = (
  payments: BcPaymentRecord[],
): BcPaymentRecord[] => {
  const seen = new Set<string>();

  return payments.filter((payment) => {
    const key =
      payment.invoiceId === null
        ? `id:${payment.externalId ?? payment.id}`
        : `invoice:${payment.invoiceId}:${payment.kind}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

export const computeFinance = (dataset: FinanceDataset): FinanceComputation => {
  const { period, appName } = dataset;
  const endTime = Date.parse(period.end);
  const prices = buildPlanPriceIndex(dataset.plans);
  const hasPricedPlan = [...prices.values()].some((price) => price > 0);
  const portfolioIds = new Set(
    dataset.portfolioClients.map((client) => client.id),
  );
  const portfolioMerchants = dataset.merchants.filter(
    (merchant) =>
      merchant.vipClientId !== null && portfolioIds.has(merchant.vipClientId),
  );
  const merchantsByClient = new Map<string, MerchantRecord[]>();

  for (const merchant of portfolioMerchants) {
    const clientId = merchant.vipClientId as string;

    merchantsByClient.set(clientId, [
      ...(merchantsByClient.get(clientId) ?? []),
      merchant,
    ]);
  }

  const mrrLines: MrrLine[] = [];
  let unpricedSubscriptionCount = 0;

  for (const merchant of portfolioMerchants) {
    if (
      (appName !== null && !sameApp(merchant.app?.name, appName)) ||
      !isMerchantActiveAt(merchant, endTime)
    ) {
      continue;
    }

    const planCode = readPlanAt(merchant, dataset.subscriptionEvents, endTime);
    const price = readPlanPrice(merchant.app?.name, planCode, prices);

    if (price === undefined || planCode === null) {
      unpricedSubscriptionCount += 1;
    } else if (price > 0) {
      mrrLines.push({ merchant, planCode, monthlyPrice: price });
    }
  }

  const movements = dataset.subscriptionEvents.flatMap((event) => {
    if (
      !event.isVerified ||
      event.vipClientId === null ||
      !portfolioIds.has(event.vipClientId) ||
      !isInPeriod(event.occurredAt, period) ||
      (appName !== null && !sameApp(event.appName, appName))
    ) {
      return [];
    }

    const movement = classifyMrrMovement({
      event,
      clientMerchants: merchantsByClient.get(event.vipClientId) ?? [],
      events: dataset.subscriptionEvents,
      prices,
    });

    return movement === null ? [] : [movement];
  });

  // Lifetime revenue is per client across every app, even under a product
  // filter that narrows which clients are in the cohort.
  const revenueByClient = new Map<string, number>();

  for (const payment of dedupePayments(dataset.payments)) {
    if (
      payment.vipClientId === null ||
      !portfolioIds.has(payment.vipClientId) ||
      !(Date.parse(payment.paidAt ?? '') < endTime) ||
      typeof payment.amount !== 'number'
    ) {
      continue;
    }

    const signed =
      payment.kind === 'REFUND' ? -Math.abs(payment.amount) : payment.amount;

    revenueByClient.set(
      payment.vipClientId,
      (revenueByClient.get(payment.vipClientId) ?? 0) + signed,
    );
  }

  const revenueLines: RevenueLine[] = dataset.portfolioClients.map(
    (client) => ({
      client,
      appNames: [
        ...new Set(
          (merchantsByClient.get(client.id) ?? []).flatMap((merchant) =>
            merchant.app?.name ? [merchant.app.name] : [],
          ),
        ),
      ].sort(),
      amount: revenueByClient.get(client.id) ?? null,
    }),
  );
  const clientsWithPayments = revenueLines.filter(
    (line) => line.amount !== null,
  ).length;

  const mrrStatus = hasPricedPlan ? 'OK' : 'UNAVAILABLE';
  const lifetimeStatus = dataset.hasAnyPayment ? 'OK' : 'UNAVAILABLE';
  const sumMovements = (kind: MrrMovementKind): KpiValue =>
    mrrStatus === 'OK'
      ? {
          value: movements
            .filter((movement) => movement.kind === kind)
            .reduce((total, movement) => total + movement.amount, 0),
          status: 'OK',
        }
      : unavailable;
  // Clients with no payment on record count as zero in the average, as the
  // spec asks; the page discloses how many clients the feed covers.
  const totalRevenue = revenueLines.reduce(
    (total, line) => total + (line.amount ?? 0),
    0,
  );

  return {
    kpis: {
      totalMrr:
        mrrStatus === 'OK'
          ? {
              value: mrrLines.reduce(
                (total, line) => total + line.monthlyPrice,
                0,
              ),
              status: 'OK',
            }
          : unavailable,
      newMrr: sumMovements('NEW'),
      expansionMrr: sumMovements('EXPANSION'),
      contractionMrr: sumMovements('CONTRACTION'),
      churnedMrr: sumMovements('CHURNED'),
      portfolioLifetimeRevenue:
        lifetimeStatus === 'OK'
          ? { value: totalRevenue, status: 'OK' }
          : unavailable,
      averageLifetimeRevenue:
        lifetimeStatus === 'OK'
          ? {
              value:
                revenueLines.length === 0
                  ? null
                  : totalRevenue / revenueLines.length,
              status: 'OK',
              numerator: totalRevenue,
              denominator: revenueLines.length,
            }
          : unavailable,
    },
    mrrStatus,
    lifetimeStatus,
    unpricedSubscriptionCount,
    clientsWithPayments,
    mrrLines,
    movements,
    revenueLines,
  };
};
