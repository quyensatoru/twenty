import { t } from 'twenty-sdk/front-component';

import * as SELECT_OPTIONS from '../../constants/select-options';
import { type AnalyticsMetricKey, type KpiValue } from '../../types/analytics';
import { type KpiTone } from '../components/bc-kpi-card';
import { formatCurrency, formatNumber, formatPercent } from './format.util';

const RATE_METRICS = new Set<AnalyticsMetricKey>([
  'contactCoverage',
  'upsellConversionRate',
]);

const CURRENCY_METRICS = new Set<AnalyticsMetricKey>([
  'totalMrr',
  'newMrr',
  'expansionMrr',
  'contractionMrr',
  'churnedMrr',
  'portfolioLifetimeRevenue',
  'averageLifetimeRevenue',
]);

const POSITIVE_METRICS = new Set<AnalyticsMetricKey>([
  'meetingsCompleted',
  'reviewsAcquired',
  'issuesResolved',
  'tasksCompleted',
  'clientsContacted',
  'bcInteractions',
  'followUpsCompleted',
  'bcInfluencedUpgrades',
  'newVipClients',
  'recoveredClients',
  'newMrr',
  'expansionMrr',
]);

const NEGATIVE_METRICS = new Set<AnalyticsMetricKey>([
  'downgrades',
  'uninstalls',
  'newIssues',
  'contractionMrr',
  'churnedMrr',
]);

export const readMetricTone = (key: AnalyticsMetricKey): KpiTone =>
  POSITIVE_METRICS.has(key)
    ? 'positive'
    : NEGATIVE_METRICS.has(key)
      ? 'negative'
      : 'neutral';

export const formatKpiValue = (
  key: AnalyticsMetricKey,
  kpi: KpiValue | undefined,
  currency: string,
  locale: string,
): string => {
  if (kpi === undefined) {
    return '—';
  }

  if (kpi.status === 'UNAVAILABLE') {
    return t('Unavailable');
  }

  if (RATE_METRICS.has(key)) {
    return formatPercent(kpi.value, locale);
  }

  if (CURRENCY_METRICS.has(key)) {
    return formatCurrency(kpi.value, currency, locale);
  }

  return formatNumber(kpi.value, locale);
};

type Option = { value: string; label: string; color: string };

const ALL_OPTIONS: Option[] = Object.values(SELECT_OPTIONS).flatMap(
  (options) => options as readonly Option[],
);

export const findDrilldownOption = (
  optionSet: string | undefined,
  value: string,
): Option | undefined => {
  const options =
    optionSet === undefined
      ? ALL_OPTIONS
      : ((SELECT_OPTIONS as Record<string, readonly Option[]>)[optionSet] ??
        ALL_OPTIONS);

  return options.find((option) => option.value === value);
};
