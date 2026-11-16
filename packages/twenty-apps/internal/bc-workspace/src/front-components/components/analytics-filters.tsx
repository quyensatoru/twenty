import { t } from 'twenty-sdk/front-component';
import { IconRefresh } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import {
  type AnalyticsPeriodPreset,
  type AnalyticsView,
} from '../../types/analytics';
import { type BcContextResult } from '../../types/bc-context';
import { BcSelect } from './bc-select';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

export type AnalyticsPeriodChoice = AnalyticsPeriodPreset | 'custom';

export type AnalyticsFilterState = {
  view: AnalyticsView;
  periodChoice: AnalyticsPeriodChoice;
  from: string;
  to: string;
  appName: string | null;
  memberId: string | null;
};

const ALL = '__all__';

export const AnalyticsFilters = ({
  filters,
  context,
  isMobile,
  onChange,
  onReset,
}: {
  filters: AnalyticsFilterState;
  context: BcContextResult;
  isMobile: boolean;
  onChange: (next: AnalyticsFilterState) => void;
  onReset: () => void;
}) => {
  const periodOptions = [
    { value: '7', label: t('Last 7 days') },
    { value: '30', label: t('Last 30 days') },
    { value: '90', label: t('Last 90 days') },
    { value: '180', label: t('Last 180 days') },
    { value: '365', label: t('Last 12 months') },
    { value: 'custom', label: t('Custom range') },
  ];
  const isDefault =
    filters.periodChoice === '30' &&
    filters.appName === null &&
    filters.memberId === null;

  return (
    <div
      style={{
        alignItems: 'center',
        background: BC_TOKENS.background,
        borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
        display: 'flex',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: spacing(1),
        minHeight: 40,
        padding: `${spacing(1)} ${isMobile ? spacing(3) : spacing(4)}`,
      }}
    >
      <BcSelect
        variant="filter"
        ariaLabel={t('Reporting period')}
        prefix={t('Period')}
        value={filters.periodChoice}
        options={periodOptions}
        isActive={filters.periodChoice !== '30'}
        onChange={(value) =>
          onChange({ ...filters, periodChoice: value as AnalyticsPeriodChoice })
        }
      />
      {filters.periodChoice === 'custom' && (
        <span
          style={{
            alignItems: 'center',
            display: 'inline-flex',
            gap: spacing(1),
          }}
        >
          <span
            style={{
              color: BC_TOKENS.textTertiary,
              fontSize: BC_TOKENS.fontSizeSm,
            }}
          >
            {t('From')}
          </span>
          <span style={{ width: 150 }}>
            <BcTextInput
              type="date"
              ariaLabel={t('From date')}
              value={filters.from}
              max={filters.to}
              onChange={(from) => onChange({ ...filters, from })}
            />
          </span>
          <span
            style={{
              color: BC_TOKENS.textTertiary,
              fontSize: BC_TOKENS.fontSizeSm,
            }}
          >
            {t('To')}
          </span>
          <span style={{ width: 150 }}>
            <BcTextInput
              type="date"
              ariaLabel={t('To date')}
              value={filters.to}
              min={filters.from}
              onChange={(to) => onChange({ ...filters, to })}
            />
          </span>
        </span>
      )}
      <BcSelect
        variant="filter"
        ariaLabel={t('Product')}
        prefix={t('Product')}
        value={filters.appName ?? ALL}
        isActive={filters.appName !== null}
        options={[
          { value: ALL, label: t('All products') },
          ...context.appNames.map((appName) => ({
            value: appName,
            label: appName,
          })),
        ]}
        onChange={(value) =>
          onChange({ ...filters, appName: value === ALL ? null : value })
        }
      />
      {filters.view === 'TEAM' && (
        <BcSelect
          variant="filter"
          ariaLabel={t('Business Consultant')}
          prefix={t('BC')}
          value={filters.memberId ?? ALL}
          isActive={filters.memberId !== null}
          menuWidth={260}
          options={[
            { value: ALL, label: t('Whole team') },
            ...context.members.map((member) => ({
              value: member.workspaceMemberId,
              label: member.name,
              description: member.teamName ?? undefined,
            })),
          ]}
          onChange={(value) =>
            onChange({ ...filters, memberId: value === ALL ? null : value })
          }
        />
      )}
      {!isDefault && (
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          startIcon={<IconRefresh size={14} />}
          onClick={onReset}
        >
          {t('Reset')}
        </Button>
      )}
    </div>
  );
};
