import { t } from 'twenty-sdk/front-component';
import { Tag } from 'twenty-ui/primitives/data-display';

import {
  type AppHealth,
  type ReviewState,
  type SubscriptionLifecycle,
} from '../../types/bc-records';
import {
  OPTION_SETS,
  readOptionColor,
  readOptionLabel,
} from '../utils/option-labels.util';
import { BC_TOKENS, readAppColor, readColorScale, spacing } from './bc-theme';

type TagColor = Parameters<typeof Tag>[0]['color'];

export const OptionTag = ({
  options,
  value,
}: {
  options: readonly { value: string; label: string; color: string }[];
  value: string | null | undefined;
}) =>
  value === null || value === undefined ? (
    <span style={{ color: BC_TOKENS.textTertiary }}>—</span>
  ) : (
    <Tag color={readOptionColor(options, value) as TagColor}>
      {readOptionLabel(options, value)}
    </Tag>
  );

export const RelationshipStatusTag = ({ value }: { value: string | null }) => (
  <OptionTag options={OPTION_SETS.relationshipStatus} value={value} />
);

export const TaskStatusTag = ({ value }: { value: string | null }) => (
  <OptionTag options={OPTION_SETS.taskStatus} value={value} />
);

export const PriorityTag = ({ value }: { value: string | null }) => (
  <OptionTag options={OPTION_SETS.taskPriority} value={value} />
);

const HEALTH_STYLES: Record<AppHealth, { color: TagColor; label: string }> = {
  HEALTHY: { color: 'green' as TagColor, label: 'Healthy' },
  AT_RISK: { color: 'red' as TagColor, label: 'At Risk' },
  INACTIVE: { color: 'gray' as TagColor, label: 'Inactive' },
};

export const AppHealthTag = ({ value }: { value: AppHealth }) => (
  <Tag color={HEALTH_STYLES[value].color}>{t(HEALTH_STYLES[value].label)}</Tag>
);

const LIFECYCLE_STYLES: Record<SubscriptionLifecycle, { color: TagColor; label: string }> = {
  TRIAL: { color: 'sky' as TagColor, label: 'Trial' },
  ACTIVE: { color: 'green' as TagColor, label: 'Active' },
  CANCELLED: { color: 'orange' as TagColor, label: 'Cancelled' },
  UNINSTALLED: { color: 'gray' as TagColor, label: 'Uninstalled' },
};

export const SubscriptionLifecycleTag = ({ value }: { value: SubscriptionLifecycle }) => (
  <Tag color={LIFECYCLE_STYLES[value].color}>{t(LIFECYCLE_STYLES[value].label)}</Tag>
);

// Text plus a mark, never color alone.
export const ReviewStateLabel = ({ value }: { value: ReviewState }) => {
  if (value === 'REVIEWED') {
    return (
      <span style={{ color: readColorScale('green').ink, fontWeight: BC_TOKENS.fontWeightMedium }}>
        ✓ {t('Reviewed')}
      </span>
    );
  }

  if (value === 'NEEDS_REVIEW') {
    return <span style={{ color: BC_TOKENS.textSecondary }}>— {t('Needs review')}</span>;
  }

  return <span style={{ color: BC_TOKENS.textTertiary }}>{t('Not eligible')}</span>;
};

// Product badge in the support inbox's colors: a small square and the name.
export const AppBadge = ({ appName }: { appName: string | null }) => (
  <span
    style={{
      alignItems: 'center',
      background: readColorScale(readAppColor(appName)).soft,
      borderRadius: BC_TOKENS.radiusSmall,
      color: readColorScale(readAppColor(appName)).ink,
      display: 'inline-flex',
      fontSize: BC_TOKENS.fontSizeSm,
      fontWeight: BC_TOKENS.fontWeightMedium,
      gap: spacing(1),
      height: 20,
      padding: `0 ${spacing(1.5)}`,
      whiteSpace: 'nowrap',
    }}
  >
    {appName ?? '—'}
  </span>
);
