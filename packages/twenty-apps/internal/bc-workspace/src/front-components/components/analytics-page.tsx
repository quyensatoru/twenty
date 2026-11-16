import { type ReactNode, useMemo, useState } from 'react';
import { t, useLocale } from 'twenty-sdk/front-component';
import { IconChartBar } from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { SegmentedControl } from 'twenty-ui/primitives/input';

import {
  CHART_DEFINITIONS,
  METRIC_DEFINITIONS,
} from '../../constants/metric-definitions';
import {
  type AnalyticsMetricKey,
  type AnalyticsRequest,
  type AnalyticsResult,
  type AnalyticsView,
} from '../../types/analytics';
import { useAnalytics } from '../hooks/use-analytics';
import { useBcContext } from '../hooks/use-bc-context';
import { useIsMobile } from '../hooks/use-is-mobile';
import {
  formatKpiValue,
  readMetricTone,
} from '../utils/analytics-display.util';
import { formatDate, formatNumber } from '../utils/format.util';
import {
  OPTION_SETS,
  readOptionColor,
  readOptionLabel,
} from '../utils/option-labels.util';
import {
  AnalyticsBarList,
  AnalyticsCoverageMeter,
  AnalyticsTrendChart,
} from './analytics-charts';
import { AnalyticsDrilldownPanel } from './analytics-drilldown-panel';
import {
  type AnalyticsFilterState,
  AnalyticsFilters,
} from './analytics-filters';
import { AnalyticsSkeleton } from './analytics-skeleton';
import {
  AnalyticsRevenueTable,
  AnalyticsReviewsTable,
  AnalyticsTeamTable,
} from './analytics-tables';
import { BcInfoTip, type MetricDefinition } from './bc-info-tip';
import { BcKpiCard, BcKpiGrid } from './bc-kpi-card';
import { BcPageHeader, NoBcAccess, readScopeLabel } from './bc-page';
import { BcThemeRoot } from './bc-theme-root';
import {
  BC_TOKENS,
  readColorScale,
  spacing,
  THIN_SCROLLBAR_STYLE,
} from './bc-theme';

const DAY_MS = 86_400_000;

const toLocalDate = (time: number): string => {
  const date = new Date(time);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const buildDefaultFilters = (view: AnalyticsView): AnalyticsFilterState => ({
  view,
  periodChoice: '30',
  from: toLocalDate(Date.now() - 29 * DAY_MS),
  to: toLocalDate(Date.now()),
  appName: null,
  memberId: null,
});

const buildRequest = (
  filters: AnalyticsFilterState,
): AnalyticsRequest | null => {
  if (filters.periodChoice === 'custom') {
    if (
      filters.from.length === 0 ||
      filters.to.length === 0 ||
      filters.from > filters.to
    ) {
      return null;
    }

    return {
      view: filters.view,
      period: { from: filters.from, to: filters.to },
      appName: filters.appName,
      memberId: filters.view === 'TEAM' ? filters.memberId : null,
    };
  }

  return {
    view: filters.view,
    period: { preset: filters.periodChoice },
    appName: filters.appName,
    memberId: filters.view === 'TEAM' ? filters.memberId : null,
  };
};

const SectionHeading = ({ title, hint }: { title: string; hint?: string }) => (
  <div
    style={{
      alignItems: 'baseline',
      display: 'flex',
      flexWrap: 'wrap',
      gap: spacing(2),
      justifyContent: 'space-between',
      marginTop: spacing(2),
    }}
  >
    <span
      style={{
        fontSize: BC_TOKENS.fontSizeLg,
        fontWeight: BC_TOKENS.fontWeightSemiBold,
      }}
    >
      {title}
    </span>
    {hint !== undefined && (
      <span
        style={{
          color: BC_TOKENS.textTertiary,
          fontSize: BC_TOKENS.fontSizeSm,
        }}
      >
        {hint}
      </span>
    )}
  </div>
);

const Panel = ({
  title,
  hint,
  metric,
  children,
}: {
  title: string;
  hint?: string;
  metric?: MetricDefinition;
  children: ReactNode;
}) => (
  <section
    style={{
      background: BC_TOKENS.background,
      border: `1px solid ${BC_TOKENS.borderLight}`,
      borderRadius: BC_TOKENS.radius,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing(3),
      minWidth: 0,
      padding: spacing(4),
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
      <span
        style={{
          alignItems: 'center',
          display: 'flex',
          fontWeight: BC_TOKENS.fontWeightSemiBold,
          gap: spacing(1),
          justifyContent: 'space-between',
        }}
      >
        {title}
        {metric !== undefined && <BcInfoTip label={title} metric={metric} />}
      </span>
      {hint !== undefined && (
        <span
          style={{
            color: BC_TOKENS.textTertiary,
            fontSize: BC_TOKENS.fontSizeSm,
          }}
        >
          {hint}
        </span>
      )}
    </div>
    {children}
  </section>
);

const PanelGrid = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gap: spacing(3),
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    }}
  >
    {children}
  </div>
);

const AnalyticsBody = ({
  data,
  selectedMetric,
  currency,
  locale,
  timezone,
  onSelectMetric,
  onSelectMember,
}: {
  data: AnalyticsResult;
  selectedMetric: AnalyticsMetricKey | null;
  currency: string;
  locale: string;
  timezone: string;
  onSelectMetric: (metricKey: AnalyticsMetricKey) => void;
  onSelectMember: (memberId: string) => void;
}) => {
  const kpi = (key: AnalyticsMetricKey) => data.kpis[key];
  const card = (key: AnalyticsMetricKey, caption?: ReactNode) => {
    const definition = METRIC_DEFINITIONS[key];

    return (
      <BcKpiCard
        key={key}
        label={t(definition.label)}
        value={formatKpiValue(key, kpi(key), currency, locale)}
        caption={caption}
        tone={
          kpi(key)?.status === 'UNAVAILABLE' ? 'neutral' : readMetricTone(key)
        }
        metric={definition}
        isSelected={selectedMetric === key}
        actionLabel={t('Explore')}
        onClick={() => onSelectMetric(key)}
      />
    );
  };
  const coverage = kpi('contactCoverage');
  const conversion = kpi('upsellConversionRate');
  const finance = data.finance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(4) }}>
      <SectionHeading title={t('Performance overview')} />
      <BcKpiGrid>
        {card('meetingsCompleted', t('Recorded BC meetings'))}
        {card('reviewsAcquired', t('Verified and BC-influenced'))}
        {card(
          'clientsContacted',
          t('{share} of the managed portfolio', {
            share: formatKpiValue(
              'contactCoverage',
              coverage,
              currency,
              locale,
            ),
          }),
        )}
        {card('bcInfluencedUpgrades', t('Verified, after BC outreach'))}
        {card('issuesResolved', t('Confirmed by a BC'))}
        {card('tasksCompleted', t('BC-owned tasks'))}
      </BcKpiGrid>

      <SectionHeading
        title={t('Client engagement')}
        hint={t('Counts BC-authored contact, not CS-only messages.')}
      />
      <PanelGrid>
        <Panel
          title={t('Engagement trend')}
          hint={t('BC interactions and completed meetings across the period.')}
          metric={CHART_DEFINITIONS.engagementTrend}
        >
          <AnalyticsTrendChart buckets={data.trend} />
        </Panel>
        <Panel
          title={t('Client contact coverage')}
          hint={t('Managed clients reached by a BC during the period.')}
          metric={METRIC_DEFINITIONS.contactCoverage}
        >
          <AnalyticsCoverageMeter
            share={coverage?.value ?? null}
            label={t('{contacted} of {managed} managed clients contacted', {
              contacted: coverage?.numerator ?? 0,
              managed: coverage?.denominator ?? 0,
            })}
          />
          <BcKpiGrid minWidth={160}>
            {card(
              'bcInteractions',
              t('Crisp, email, calls, review requests and meetings'),
            )}
            {card('followUpsCompleted', t('Completed follow-up tasks'))}
          </BcKpiGrid>
        </Panel>
      </PanelGrid>

      <SectionHeading
        title={t('Business growth')}
        hint={t(
          'BC-influenced results are kept apart from upgrades that happened on their own.',
        )}
      />
      <PanelGrid>
        <Panel
          title={t('Upsell and subscription movement')}
          hint={t(
            'An automatic upsell task does not by itself prove BC influence.',
          )}
        >
          <BcKpiGrid minWidth={160}>
            {card('upsellOpportunities', t('Created in the period'))}
            {card('bcInfluencedUpgrades', t('Verified conversions'))}
            {card('portfolioUpgrades', t('With or without a BC'))}
            {card(
              'upsellConversionRate',
              t('{converted} of {total} opportunities', {
                converted: conversion?.numerator ?? 0,
                total: conversion?.denominator ?? 0,
              }),
            )}
            {card('downgrades', t('Verified plan changes'))}
            {card('uninstalls', t('Verified app removals'))}
          </BcKpiGrid>
        </Panel>
        <Panel
          title={t('Shopify reviews')}
          hint={t(
            'Verified reviews credited to a BC who asked for them before they were published.',
          )}
        >
          <BcKpiGrid minWidth={160}>
            {card('reviewsAcquired', t('Acquired in the period'))}
          </BcKpiGrid>
          <AnalyticsReviewsTable
            reviews={data.reviews}
            locale={locale}
            timezone={timezone}
          />
        </Panel>
      </PanelGrid>

      <SectionHeading
        title={t('Client portfolio and retention')}
        hint={t(
          'Issue outcomes in the period and current relationship health.',
        )}
      />
      <PanelGrid>
        <Panel
          title={t('Client status')}
          hint={t('Status of the managed clients at the end of the period.')}
          metric={CHART_DEFINITIONS.statusSnapshot}
        >
          <AnalyticsBarList
            items={data.statusSnapshot.map((entry) => ({
              key: entry.status,
              label: readOptionLabel(
                OPTION_SETS.relationshipStatus,
                entry.status,
              ),
              value: entry.count,
              color: readColorScale(
                readOptionColor(OPTION_SETS.relationshipStatus, entry.status),
              ).solid,
            }))}
          />
        </Panel>
        <Panel
          title={t('Portfolio activity')}
          hint={t(
            'Assignments, AI-detected issues and BC-confirmed recoveries.',
          )}
        >
          <BcKpiGrid minWidth={160}>
            {card('managedClients', t('Snapshot at period end'))}
            {card('newVipClients', t('First assignments'))}
            {card('transferredClients', t('Moved from another BC'))}
            {card('newIssues', t('Distinct issues detected'))}
            {card('recoveredClients', t('Left At Risk'))}
          </BcKpiGrid>
        </Panel>
      </PanelGrid>

      <SectionHeading
        title={t('Task performance')}
        hint={t('No due dates, overdue counts or age-based escalation.')}
      />
      <PanelGrid>
        <Panel
          title={t('Task summary')}
          hint={t(
            'BC-owned tasks only; developer tasks are tracked in Task Manager.',
          )}
        >
          <BcKpiGrid minWidth={160}>
            {card('tasksCreated', t('Created in the period'))}
            {card('tasksCompleted', t('Completed in the period'))}
            {card('openTasks', t('Snapshot at period end'))}
            {card('automaticTasks', t('Created by automations'))}
            {card('manualTasks', t('Created by hand'))}
          </BcKpiGrid>
        </Panel>
        <Panel
          title={t('Tasks by category')}
          hint={t('Tasks created in the period.')}
        >
          <AnalyticsBarList
            items={data.tasksByCategory.map((entry) => ({
              key: entry.category,
              label: readOptionLabel(OPTION_SETS.taskCategory, entry.category),
              hint:
                entry.customLabels.length > 0
                  ? entry.customLabels.join(', ')
                  : undefined,
              value: entry.count,
              color: readColorScale('blue').solid,
            }))}
          />
          {data.taskOutcomes.length > 0 && (
            <span
              style={{
                color: BC_TOKENS.textTertiary,
                fontSize: BC_TOKENS.fontSizeSm,
              }}
            >
              {t('Upsell outcomes:')}{' '}
              {data.taskOutcomes
                .map(
                  (outcome) =>
                    `${readOptionLabel(OPTION_SETS.taskOutcomeStatus, outcome.outcomeStatus)} ${formatNumber(outcome.count, locale)}`,
                )
                .join(' · ')}
            </span>
          )}
        </Panel>
      </PanelGrid>

      {data.teamComparison !== null && (
        <>
          <SectionHeading
            title={t('Team comparison')}
            hint={t('Select a BC to see only their figures.')}
          />
          <Panel title={t('BCs in this view')}>
            <AnalyticsTeamTable
              rows={data.teamComparison}
              onSelectMember={onSelectMember}
            />
          </Panel>
        </>
      )}

      {finance !== undefined && (
        <>
          <SectionHeading
            title={t('Financial performance')}
            hint={t('Visible to BC managers only.')}
          />
          {finance.mrrStatus === 'UNAVAILABLE' && (
            <Banner color="blue" variant="secondary">
              {t(
                'MRR is unavailable: set monthly prices in the App Plans catalog.',
              )}
            </Banner>
          )}
          {finance.unpricedSubscriptionCount > 0 &&
            finance.mrrStatus === 'OK' && (
              <Banner color="blue" variant="secondary">
                {t(
                  '{count} active subscriptions have a plan without a price and are left out of MRR.',
                  {
                    count: finance.unpricedSubscriptionCount,
                  },
                )}
              </Banner>
            )}
          <BcKpiGrid>
            {card('totalMrr', t('Active paid subscriptions at period end'))}
            {card('newMrr', t('From clients new to paid apps'))}
            {card('expansionMrr', t('Upgrades and extra apps'))}
            {card('contractionMrr', t('Downgrades and removed apps'))}
            {card('churnedMrr', t('Last paid app cancelled'))}
          </BcKpiGrid>
          <PanelGrid>
            <Panel
              title={t('Historical realized lifetime revenue')}
              hint={t(
                'Collected payments minus refunds through the period end, all apps combined per client.',
              )}
            >
              {finance.lifetimeStatus === 'UNAVAILABLE' ? (
                <Banner color="blue" variant="secondary">
                  {t(
                    'Unavailable — no payment feed connected. Figures are not shown as zero.',
                  )}
                </Banner>
              ) : (
                <>
                  <span
                    style={{
                      color: BC_TOKENS.textSecondary,
                      fontSize: BC_TOKENS.fontSizeSm,
                    }}
                  >
                    {t(
                      'Payment data covers {covered} of {total} clients; the others show "No payments recorded" and count as zero in the average.',
                      {
                        covered: finance.clientsWithPayments,
                        total: finance.clientCount,
                      },
                    )}
                  </span>
                  <BcKpiGrid minWidth={180}>
                    {card(
                      'portfolioLifetimeRevenue',
                      t('Unique clients in the portfolio'),
                    )}
                    {card(
                      'averageLifetimeRevenue',
                      t(
                        'Over {count} clients, including those without payments',
                        {
                          count:
                            kpi('averageLifetimeRevenue')?.denominator ?? 0,
                        },
                      ),
                    )}
                  </BcKpiGrid>
                  <AnalyticsRevenueTable
                    rows={finance.revenueRows}
                    currency={finance.currency}
                    locale={locale}
                  />
                </>
              )}
            </Panel>
          </PanelGrid>
        </>
      )}
    </div>
  );
};

export const AnalyticsPage = () => {
  const { context, error: contextError } = useBcContext();
  const isMobile = useIsMobile();
  const locale = useLocale();
  const canSeeTeam =
    context?.scope.role === 'MANAGER' || context?.scope.role === 'ADMIN';
  const [chosenFilters, setFilters] = useState<AnalyticsFilterState | null>(
    null,
  );
  const filters =
    chosenFilters ??
    buildDefaultFilters(context?.scope.role === 'ADMIN' ? 'TEAM' : 'MY');
  const request = useMemo(
    () =>
      context === null || context.scope.role === 'NONE'
        ? null
        : buildRequest(filters),
    [context, filters],
  );
  const { data, isLoading, error } = useAnalytics(request);
  const [selectedMetric, setSelectedMetric] =
    useState<AnalyticsMetricKey | null>(null);
  const currency =
    data?.finance?.currency ?? context?.settings.baseCurrency ?? 'USD';
  const reportingTimezone =
    data?.period.timezone ?? context?.settings.reportingTimezone ?? 'UTC';
  const isCustomRangeInvalid =
    filters.periodChoice === 'custom' && request === null;

  const updateFilters = (next: AnalyticsFilterState) => {
    setFilters(next);
  };

  const panel =
    selectedMetric !== null && request !== null && data !== null ? (
      <AnalyticsDrilldownPanel
        key={selectedMetric}
        request={request}
        metricKey={selectedMetric}
        kpi={data.kpis[selectedMetric]}
        currency={currency}
        locale={locale}
        timezone={reportingTimezone}
        width={isMobile ? '100%' : 560}
        onClose={() => setSelectedMetric(null)}
      />
    ) : null;

  const periodCaption =
    data === null
      ? null
      : t('{from} – {to} · timezone {timezone}', {
          from: formatDate(`${data.period.fromDate}T12:00:00.000Z`, locale),
          to: formatDate(`${data.period.toDate}T12:00:00.000Z`, locale),
          timezone: data.period.timezone,
        });

  return (
    <BcThemeRoot>
      <div
        style={{
          background: BC_TOKENS.background,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        <BcPageHeader
          icon={<IconChartBar size={16} />}
          title={t('BC Analytics')}
          scopeLabel={readScopeLabel(context)}
          isMobile={isMobile}
          actions={
            canSeeTeam ? (
              <SegmentedControl
                aria-label={t('Analytics view')}
                value={filters.view}
                onValueChange={(value) => {
                  setSelectedMetric(null);
                  updateFilters({
                    ...filters,
                    view: value === 'TEAM' ? 'TEAM' : 'MY',
                    memberId: null,
                  });
                }}
                options={[
                  { value: 'MY', label: t('My analytics') },
                  { value: 'TEAM', label: t('Team analytics') },
                ]}
              />
            ) : undefined
          }
        />
        {contextError !== null && (
          <div style={{ padding: spacing(4) }}>
            <Banner color="danger" variant="secondary">
              {contextError}
            </Banner>
          </div>
        )}
        {context?.scope.role === 'NONE' && <NoBcAccess />}
        {context !== null && context.scope.role !== 'NONE' && (
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div
              style={{
                // On mobile the panel covers the page, which stays mounted
                // and only hidden so its scroll position survives.
                display: isMobile && panel !== null ? 'none' : 'flex',
                flex: 1,
                flexDirection: 'column',
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <AnalyticsFilters
                filters={filters}
                context={context}
                isMobile={isMobile}
                onChange={updateFilters}
                onReset={() => updateFilters(buildDefaultFilters(filters.view))}
              />
              <div
                style={{
                  background: BC_TOKENS.backgroundSecondary,
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: isMobile ? spacing(3) : spacing(4),
                  ...THIN_SCROLLBAR_STYLE,
                }}
              >
                <div
                  style={{
                    color: BC_TOKENS.textTertiary,
                    display: 'flex',
                    flexWrap: 'wrap',
                    fontSize: BC_TOKENS.fontSizeSm,
                    gap: spacing(2),
                    justifyContent: 'space-between',
                    marginBottom: spacing(2),
                  }}
                >
                  <span>
                    {t(
                      'Event metrics use the selected period; portfolio and open tasks are end-of-period snapshots.',
                    )}
                  </span>
                  {periodCaption !== null && <span>{periodCaption}</span>}
                </div>
                {isCustomRangeInvalid && (
                  <div style={{ marginBottom: spacing(3) }}>
                    <Banner color="blue" variant="secondary">
                      {t('Pick a From date on or before the To date.')}
                    </Banner>
                  </div>
                )}
                {error !== null && (
                  <div style={{ marginBottom: spacing(3) }}>
                    <Banner color="danger" variant="secondary">
                      {error}
                    </Banner>
                  </div>
                )}
                {data === null && error === null && <AnalyticsSkeleton />}
                {data !== null && (
                  <div
                    style={{
                      opacity: isLoading ? 0.6 : 1,
                      transition: 'opacity 150ms ease-in-out',
                    }}
                  >
                    <AnalyticsBody
                      data={data}
                      selectedMetric={selectedMetric}
                      currency={currency}
                      locale={locale}
                      timezone={reportingTimezone}
                      onSelectMetric={(metricKey) =>
                        setSelectedMetric(
                          selectedMetric === metricKey ? null : metricKey,
                        )
                      }
                      onSelectMember={(memberId) => {
                        setSelectedMetric(null);
                        updateFilters({ ...filters, memberId });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            {panel}
          </div>
        )}
      </div>
    </BcThemeRoot>
  );
};
