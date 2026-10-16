import { type ReactNode, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconX } from 'twenty-ui/icon';

import { TASK_TOKENS } from './task-tokens';

type TaskChipProps = {
  children: ReactNode;
  icon?: ReactNode;
  title?: string;
  tone?: 'default' | 'danger' | 'accent';
  isMuted?: boolean;
};

const TONES = {
  default: {
    background: 'transparent',
    border: TASK_TOKENS.border,
    color: TASK_TOKENS.textSecondary,
  },
  danger: {
    background: TASK_TOKENS.backgroundDanger,
    border: 'transparent',
    color: TASK_TOKENS.textDanger,
  },
  accent: {
    background: TASK_TOKENS.accentSoft,
    border: 'transparent',
    color: TASK_TOKENS.accent,
  },
} as const;

// The small bordered property chip on cards and rows: points, due date, epic,
// subtasks. Quieter than a tag, so a row of them reads as metadata.
export const TaskChip = ({
  children,
  icon,
  title,
  tone = 'default',
  isMuted = false,
}: TaskChipProps) => {
  const palette = TONES[tone];

  return (
    <span
      title={title}
      style={{
        alignItems: 'center',
        background: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: TASK_TOKENS.radiusExtraSmall,
        boxSizing: 'border-box',
        color: palette.color,
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        gap: 5,
        height: 22,
        maxWidth: 160,
        opacity: isMuted ? 0.7 : 1,
        overflow: 'hidden',
        padding: '0 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {children}
      </span>
    </span>
  );
};

type TaskColorDotProps = {
  color: string;
  size?: number;
};

// A square-ish swatch, the way an epic or a label colour is marked inline.
export const TaskColorDot = ({ color, size = 8 }: TaskColorDotProps) => (
  <span
    style={{
      background: color,
      borderRadius: 2,
      display: 'inline-block',
      flexShrink: 0,
      height: size,
      width: size,
    }}
  />
);

type TaskFilterChipProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  onRemove: () => void;
};

// An applied filter: "Priority  High  ×". The label is quiet and the value
// carries the weight, so a bar of several still scans as values.
export const TaskFilterChip = ({
  label,
  value,
  icon,
  onRemove,
}: TaskFilterChipProps) => {
  const [isRemoveHovered, setIsRemoveHovered] = useState(false);

  return (
    <span
      style={{
        alignItems: 'center',
        background: TASK_TOKENS.background,
        border: `1px solid ${TASK_TOKENS.border}`,
        borderRadius: TASK_TOKENS.radiusSmall,
        boxSizing: 'border-box',
        display: 'inline-flex',
        flexShrink: 0,
        fontFamily: TASK_TOKENS.fontFamily,
        fontSize: 12,
        height: 26,
        maxWidth: 280,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          alignItems: 'center',
          color: TASK_TOKENS.textTertiary,
          display: 'inline-flex',
          gap: 6,
          padding: '0 6px 0 8px',
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        {label}
      </span>
      <span
        style={{
          color: TASK_TOKENS.textPrimary,
          fontWeight: 500,
          overflow: 'hidden',
          paddingRight: 2,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={t('Remove filter')}
        title={t('Remove filter')}
        onClick={onRemove}
        onMouseEnter={() => setIsRemoveHovered(true)}
        onMouseLeave={() => setIsRemoveHovered(false)}
        style={{
          alignItems: 'center',
          alignSelf: 'stretch',
          background: isRemoveHovered
            ? TASK_TOKENS.backgroundHover
            : 'transparent',
          border: 'none',
          color: isRemoveHovered
            ? TASK_TOKENS.textPrimary
            : TASK_TOKENS.textTertiary,
          cursor: 'pointer',
          display: 'inline-flex',
          flexShrink: 0,
          padding: '0 6px',
        }}
      >
        <IconX size={12} />
      </button>
    </span>
  );
};
