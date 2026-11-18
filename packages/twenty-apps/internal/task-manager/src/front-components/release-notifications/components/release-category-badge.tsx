import { t } from 'twenty-sdk/front-component';
import { IconSparkles, IconTool, IconTrendingUp } from 'twenty-ui/icon';

import {
  RELEASE_NOTIFICATION_CATEGORY_OPTIONS,
  type ReleaseNotificationCategory,
} from '../../../constants/release-notification';
import { readTagColor, TASK_TOKENS } from '../../components/task-tokens';

const CATEGORY_ICONS = {
  NEW: IconSparkles,
  IMPROVEMENT: IconTrendingUp,
  FIX: IconTool,
} as const;

export const readReleaseCategoryLabel = (
  category: ReleaseNotificationCategory | null,
): string => {
  switch (category) {
    case 'IMPROVEMENT':
      return t('Improvement');
    case 'FIX':
      return t('Fix');
    default:
      return t('New');
  }
};

export const readReleaseCategoryTone = (
  category: ReleaseNotificationCategory | null,
) =>
  readTagColor(
    RELEASE_NOTIFICATION_CATEGORY_OPTIONS.find(
      (option) => option.value === (category ?? 'NEW'),
    )?.color,
  );

export const ReleaseCategoryIcon = ({
  category,
  size = 32,
}: {
  category: ReleaseNotificationCategory | null;
  size?: number;
}) => {
  const Icon = CATEGORY_ICONS[category ?? 'NEW'];
  const tone = readReleaseCategoryTone(category);

  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: 'center',
        background: tone.background,
        borderRadius: TASK_TOKENS.radius,
        color: tone.text,
        display: 'inline-flex',
        flexShrink: 0,
        height: size,
        justifyContent: 'center',
        width: size,
      }}
    >
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
};

export const ReleaseCategoryTag = ({
  category,
}: {
  category: ReleaseNotificationCategory | null;
}) => {
  const Icon = CATEGORY_ICONS[category ?? 'NEW'];
  const tone = readReleaseCategoryTone(category);

  return (
    <span
      style={{
        alignItems: 'center',
        background: tone.background,
        borderRadius: TASK_TOKENS.radiusExtraSmall,
        boxSizing: 'border-box',
        color: tone.text,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        fontWeight: 600,
        gap: 4,
        height: 20,
        padding: '0 7px 0 6px',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} />
      {readReleaseCategoryLabel(category)}
    </span>
  );
};
