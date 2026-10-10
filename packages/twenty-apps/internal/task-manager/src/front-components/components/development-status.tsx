import { t } from 'twenty-sdk/front-component';
import {
  IconArrowMerge,
  IconCheck,
  IconCircleX,
  IconClock,
  IconLoader,
  IconPlayerPause,
} from 'twenty-ui/icon';

import { readTagColor, TASK_TOKENS } from './task-tokens';

type DevelopmentStatusProps = { status: string };

const readStatus = (status: string) => {
  switch (status) {
    case 'SUCCESSFUL':
      return { label: t('Successful'), color: 'green', Icon: IconCheck };
    case 'FAILED':
      return { label: t('Failed'), color: 'red', Icon: IconCircleX };
    case 'IN_PROGRESS':
      return { label: t('In progress'), color: 'blue', Icon: IconLoader };
    case 'OPEN':
      return { label: t('Open'), color: 'green', Icon: IconArrowMerge };
    case 'MERGED':
      return { label: t('Merged'), color: 'purple', Icon: IconArrowMerge };
    case 'CLOSED':
      return { label: t('Closed'), color: 'gray', Icon: IconCircleX };
    case 'DRAFT':
      return { label: t('Draft'), color: 'gray', Icon: IconArrowMerge };
    case 'PENDING':
      return { label: t('Pending'), color: 'gray', Icon: IconClock };
    case 'BLOCKED':
      return { label: t('Blocked'), color: 'orange', Icon: IconPlayerPause };
    case 'CANCELLED':
      return { label: t('Cancelled'), color: 'gray', Icon: IconCircleX };
    case 'SKIPPED':
      return { label: t('Skipped'), color: 'gray', Icon: IconPlayerPause };
    case 'INACTIVE':
      return { label: t('Inactive'), color: 'gray', Icon: IconPlayerPause };
    case 'DELETED':
      return { label: t('Deleted'), color: 'gray', Icon: IconCircleX };
    default:
      return { label: t('Unknown'), color: 'gray', Icon: IconClock };
  }
};

export const DevelopmentStatus = ({ status }: DevelopmentStatusProps) => {
  const { label, color, Icon } = readStatus(status);
  const tone = readTagColor(color);
  return (
    <span
      style={{
        alignItems: 'center',
        background: tone.background,
        borderRadius: TASK_TOKENS.radiusExtraSmall,
        color: tone.text,
        display: 'inline-flex',
        flexShrink: 0,
        fontSize: 11,
        gap: 4,
        lineHeight: '20px',
        padding: '0 6px',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
};
