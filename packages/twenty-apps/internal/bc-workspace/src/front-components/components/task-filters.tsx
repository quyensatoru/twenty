import '../../types/front-component-host-elements';

import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconChevronDown, IconSearch, IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { type BcContextMember } from '../../types/bc-context';
import {
  type TaskCategory,
  type TaskPriority,
  type TaskSource,
  type TaskStatus,
} from '../../types/bc-records';
import {
  type CreatedPreset,
  countActiveFilters,
  DEFAULT_TASK_FILTERS,
  type TaskFilterState,
} from '../utils/task-filters.util';
import { OPTION_SETS, toSelectOptions } from '../utils/option-labels.util';
import { type TaskClientSummary } from '../../types/tasks';
import { BcSelect } from './bc-select';
import { ClientAutocomplete } from './client-autocomplete';
import { BcTextInput } from './bc-text-input';
import { BC_TOKENS, spacing } from './bc-theme';

const ALL = '';

const withAll = (label: string, options: { value: string; label: string }[]) => [
  { value: ALL, label },
  ...options,
];

const readValue = <TValue extends string>(value: string): TValue | null =>
  value === ALL ? null : (value as TValue);

const FILTER_HEIGHT = 28;

// Filter chip like BcSelect's, opening the server-side client search instead
// of a fixed list, since a BC can own more clients than a menu can hold.
const ClientFilterChip = ({
  value,
  onChange,
}: {
  value: TaskClientSummary | null;
  onChange: (client: TaskClientSummary | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = value !== null;

  return (
    <div style={{ display: 'inline-flex', flexShrink: 0, position: 'relative' }}>
      <button
        type="button"
        aria-label={t('Filter by client')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          alignItems: 'center',
          background: isActive ? BC_TOKENS.backgroundSelected : 'transparent',
          border: `1px solid ${isActive ? 'transparent' : BC_TOKENS.borderLight}`,
          borderRadius: BC_TOKENS.radiusSmall,
          color: isActive ? BC_TOKENS.accent : BC_TOKENS.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          fontFamily: BC_TOKENS.fontFamily,
          fontSize: BC_TOKENS.fontSizeMd,
          fontWeight: BC_TOKENS.fontWeightMedium,
          gap: spacing(1),
          height: FILTER_HEIGHT,
          maxWidth: 260,
          padding: `0 ${spacing(2)}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {`${t('Client')}: ${value === null ? t('All') : (value.name ?? value.shopDomain ?? '')}`}
        </span>
        <IconChevronDown size={14} color={BC_TOKENS.textTertiary} />
      </button>
      {isActive && (
        <button
          type="button"
          aria-label={t('Clear client filter')}
          onClick={() => onChange(null)}
          style={{
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            color: BC_TOKENS.textTertiary,
            cursor: 'pointer',
            display: 'inline-flex',
            padding: `0 ${spacing(1)}`,
          }}
        >
          <IconX size={12} />
        </button>
      )}
      {isOpen && (
        <twenty-overlay offsetY={FILTER_HEIGHT + 4} onClose={() => setIsOpen(false)}>
          <div
            style={{
              background: BC_TOKENS.background,
              border: `1px solid ${BC_TOKENS.border}`,
              borderRadius: BC_TOKENS.radius,
              boxShadow: BC_TOKENS.shadow,
              boxSizing: 'border-box',
              padding: spacing(2),
              width: 320,
            }}
          >
            <ClientAutocomplete
              value={null}
              allowNone={false}
              onChange={(client) => {
                onChange(client);
                setIsOpen(false);
              }}
            />
          </div>
        </twenty-overlay>
      )}
    </div>
  );
};

export const TaskFilters = ({
  filters,
  onChange,
  members,
  canFilterOwner,
  isMobile,
}: {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
  members: BcContextMember[];
  canFilterOwner: boolean;
  isMobile: boolean;
}) => {
  const update = (patch: Partial<TaskFilterState>) =>
    onChange({ ...filters, ...patch });
  const createdOptions: { value: CreatedPreset; label: string }[] = [
    { value: 'ALL', label: t('All time') },
    { value: '7', label: t('Last 7 days') },
    { value: '30', label: t('Last 30 days') },
    { value: '90', label: t('Last 90 days') },
    { value: 'CUSTOM', label: t('Custom range') },
  ];

  return (
    <div
      style={{
        alignItems: 'center',
        borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
        display: 'flex',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: spacing(1),
        minHeight: 40,
        padding: `${spacing(1)} ${isMobile ? spacing(3) : spacing(4)}`,
      }}
    >
      <div style={{ width: isMobile ? '100%' : 220 }}>
        <BcTextInput
          value={filters.search}
          onChange={(search) => update({ search })}
          type="search"
          ariaLabel={t('Search tasks')}
          placeholder={t('Search task or client…')}
          startElement={
            <span style={{ color: BC_TOKENS.textTertiary, display: 'inline-flex', paddingLeft: spacing(2) }}>
              <IconSearch size={14} />
            </span>
          }
        />
      </div>
      <ClientFilterChip
        value={filters.vipClient}
        onChange={(vipClient) => update({ vipClient })}
      />
      <BcSelect
        variant="filter"
        prefix={t('Status')}
        ariaLabel={t('Filter by status')}
        value={filters.status ?? ALL}
        isActive={filters.status !== null}
        options={withAll(t('All'), toSelectOptions(OPTION_SETS.taskStatus))}
        onChange={(value) => update({ status: readValue<TaskStatus>(value), kpi: null })}
      />
      <BcSelect
        variant="filter"
        prefix={t('Category')}
        ariaLabel={t('Filter by category')}
        value={filters.category ?? ALL}
        isActive={filters.category !== null}
        options={withAll(t('All'), toSelectOptions(OPTION_SETS.taskCategory))}
        onChange={(value) => update({ category: readValue<TaskCategory>(value) })}
      />
      <BcSelect
        variant="filter"
        prefix={t('Source')}
        ariaLabel={t('Filter by source')}
        value={filters.source ?? ALL}
        isActive={filters.source !== null}
        options={withAll(t('All'), toSelectOptions(OPTION_SETS.taskSource))}
        onChange={(value) => update({ source: readValue<TaskSource>(value) })}
      />
      <BcSelect
        variant="filter"
        prefix={t('Priority')}
        ariaLabel={t('Filter by priority')}
        value={filters.priority ?? ALL}
        isActive={filters.priority !== null}
        options={withAll(t('All'), toSelectOptions(OPTION_SETS.taskPriority))}
        onChange={(value) => update({ priority: readValue<TaskPriority>(value) })}
      />
      {canFilterOwner && (
        <BcSelect
          variant="filter"
          prefix={t('Owner')}
          ariaLabel={t('Filter by owner')}
          value={filters.ownerId ?? ALL}
          isActive={filters.ownerId !== null}
          options={withAll(
            t('Everyone'),
            members.map((member) => ({
              value: member.workspaceMemberId,
              label: member.name,
            })),
          )}
          onChange={(value) => update({ ownerId: readValue(value) })}
        />
      )}
      <BcSelect
        variant="filter"
        prefix={t('Created')}
        ariaLabel={t('Filter by created date')}
        value={filters.createdPreset}
        isActive={filters.createdPreset !== 'ALL'}
        options={createdOptions}
        onChange={(value) => update({ createdPreset: value as CreatedPreset })}
      />
      {filters.createdPreset === 'CUSTOM' && (
        <span style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(1) }}>
          <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
            {t('From')}
          </span>
          <span style={{ width: 150 }}>
            <BcTextInput
              type="date"
              value={filters.customFrom}
              max={filters.customTo.length > 0 ? filters.customTo : undefined}
              ariaLabel={t('Created from')}
              onChange={(customFrom) => update({ customFrom })}
            />
          </span>
          <span style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}>
            {t('To')}
          </span>
          <span style={{ width: 150 }}>
            <BcTextInput
              type="date"
              value={filters.customTo}
              min={filters.customFrom.length > 0 ? filters.customFrom : undefined}
              ariaLabel={t('Created to')}
              onChange={(customTo) => update({ customTo })}
            />
          </span>
        </span>
      )}
      {countActiveFilters(filters) > 0 && (
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_TASK_FILTERS, search: filters.search })}
        >
          {t('Reset')}
        </Button>
      )}
    </div>
  );
};
