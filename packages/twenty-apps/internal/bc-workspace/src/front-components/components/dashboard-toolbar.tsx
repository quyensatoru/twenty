import { type ReactNode } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconSearch, IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { type BcContextResult } from '../../types/bc-context';
import { type AppHealth, type RelationshipStatus } from '../../types/bc-records';
import { type ClientListFilters, type ReviewFilter } from '../../types/dashboard';
import { OPTION_SETS, toSelectOptions } from '../utils/option-labels.util';
import { BcSelect } from './bc-select';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, readAppColor, readColorScale, spacing } from './bc-theme';
import { UNASSIGNED_VALUE } from './client-pic';

const ALL_VALUE = 'ALL';

export const EMPTY_CLIENT_FILTERS: ClientListFilters = {
  search: '',
  appName: null,
  plan: null,
  picId: null,
  status: null,
  appHealth: null,
  review: null,
  kpi: 'ALL',
};

export const hasActiveClientFilters = (filters: ClientListFilters): boolean =>
  filters.search.trim().length > 0 ||
  filters.appName !== null ||
  filters.plan !== null ||
  filters.picId !== null ||
  filters.status !== null ||
  filters.appHealth !== null ||
  filters.review !== null ||
  filters.kpi !== 'ALL';

const toValue = (value: string | null): string => value ?? ALL_VALUE;

const fromValue = (value: string): string | null => (value === ALL_VALUE ? null : value);

const AppDot = ({ appName }: { appName: string }) => (
  <span
    style={{
      background: readColorScale(readAppColor(appName)).solid,
      borderRadius: 2,
      display: 'inline-block',
      height: 8,
      width: 8,
    }}
  />
);

// Filters follow the table's column order: client search, product, plan,
// PIC, overall status, then the per-app health and review.
export const DashboardToolbar = ({
  filters,
  onChange,
  context,
  planOptions,
  actions,
  isMobile,
}: {
  filters: ClientListFilters;
  onChange: (filters: ClientListFilters) => void;
  context: BcContextResult;
  planOptions: { value: string; label: string }[];
  actions: ReactNode;
  isMobile: boolean;
}) => {
  const update = (patch: Partial<ClientListFilters>) => onChange({ ...filters, ...patch });
  const showPicFilter = context.scope.role !== 'BC';

  return (
    <div
      style={{
        alignItems: 'center',
        borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
        display: 'flex',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: spacing(2),
        minHeight: 40,
        padding: `${spacing(1)} ${isMobile ? spacing(3) : spacing(4)}`,
      }}
    >
      <div style={{ flexShrink: 0, width: isMobile ? '100%' : 220 }}>
        <BcTextInput
          value={filters.search}
          onChange={(search) => update({ search })}
          type="search"
          ariaLabel={t('Search clients')}
          placeholder={t('Client name or domain')}
          startElement={
            <span style={{ color: BC_TOKENS.textTertiary, display: 'inline-flex', paddingLeft: spacing(2) }}>
              <IconSearch size={14} />
            </span>
          }
        />
      </div>
      {/* Chips join the toolbar's own wrap so they flow after the search box. */}
      <div style={{ display: 'contents' }}>
        <BcSelect
          variant="filter"
          ariaLabel={t('Product')}
          prefix={t('Product')}
          isActive={filters.appName !== null}
          value={toValue(filters.appName)}
          onChange={(value) => update({ appName: fromValue(value), plan: null })}
          options={[
            { value: ALL_VALUE, label: t('All') },
            ...context.appNames.map((appName) => ({
              value: appName,
              label: appName,
              startElement: <AppDot appName={appName} />,
            })),
          ]}
        />
        <BcSelect
          variant="filter"
          ariaLabel={t('Plan')}
          prefix={t('Plan')}
          isActive={filters.plan !== null}
          isDisabled={planOptions.length === 0 && filters.plan === null}
          value={toValue(filters.plan)}
          onChange={(value) => update({ plan: fromValue(value) })}
          options={[{ value: ALL_VALUE, label: t('All') }, ...planOptions]}
        />
        {showPicFilter && (
          <BcSelect
            variant="filter"
            ariaLabel={t('PIC')}
            prefix={t('PIC')}
            isActive={filters.picId !== null}
            value={toValue(filters.picId)}
            onChange={(value) => update({ picId: fromValue(value) })}
            menuWidth={260}
            options={[
              { value: ALL_VALUE, label: t('All BCs') },
              ...(context.scope.canSeeUnassigned
                ? [{ value: UNASSIGNED_VALUE, label: t('Unassigned') }]
                : []),
              ...context.members.map((member) => ({
                value: member.workspaceMemberId,
                label: member.name,
                description: member.teamName ?? undefined,
              })),
            ]}
          />
        )}
        <BcSelect
          variant="filter"
          ariaLabel={t('Status')}
          prefix={t('Status')}
          isActive={filters.status !== null}
          value={toValue(filters.status)}
          onChange={(value) =>
            update({ status: fromValue(value) as RelationshipStatus | null, kpi: 'ALL' })
          }
          options={[
            { value: ALL_VALUE, label: t('All') },
            ...toSelectOptions(OPTION_SETS.relationshipStatus),
          ]}
        />
        <BcSelect
          variant="filter"
          ariaLabel={t('App health')}
          prefix={t('App health')}
          isActive={filters.appHealth !== null}
          value={toValue(filters.appHealth)}
          onChange={(value) => update({ appHealth: fromValue(value) as AppHealth | null })}
          options={[
            { value: ALL_VALUE, label: t('All') },
            { value: 'HEALTHY', label: t('Healthy') },
            { value: 'AT_RISK', label: t('At Risk') },
            { value: 'INACTIVE', label: t('Inactive') },
          ]}
        />
        <BcSelect
          variant="filter"
          ariaLabel={t('Review')}
          prefix={t('Review')}
          isActive={filters.review !== null}
          value={toValue(filters.review)}
          onChange={(value) => update({ review: fromValue(value) as ReviewFilter | null })}
          options={[
            { value: ALL_VALUE, label: t('All') },
            { value: 'REVIEWED', label: t('Reviewed') },
            {
              value: 'NEEDS_REVIEW',
              label: t('Needs review'),
              description:
                filters.appName === null
                  ? t('At least one active app has no review')
                  : undefined,
            },
          ]}
        />
        {hasActiveClientFilters(filters) && (
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            startIcon={<IconX size={14} />}
            onClick={() => onChange(EMPTY_CLIENT_FILTERS)}
          >
            {t('Reset')}
          </Button>
        )}
      </div>
      <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: spacing(1) }}>
        {actions}
      </div>
    </div>
  );
};
