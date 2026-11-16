import { type ReactNode, useState } from 'react';
import { IconAlertTriangle, IconCheck } from 'twenty-ui/icon';

import { BC_TOKENS, readColorScale, spacing } from './bc-theme';
import { BcInfoTip, type MetricDefinition } from './bc-info-tip';

export type KpiTone = 'positive' | 'negative' | 'neutral';

const TONE_COLORS: Record<KpiTone, string | null> = {
  positive: 'green',
  negative: 'red',
  neutral: null,
};

// Tone shows on the left rule and the value; the caption carries the meaning
// in words so color is never the only cue.
export const BcKpiCard = ({
  label,
  value,
  caption,
  tone = 'neutral',
  metric,
  icon,
  isSelected = false,
  onClick,
  actionLabel,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: KpiTone;
  metric?: MetricDefinition;
  icon?: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  actionLabel?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const toneColor = TONE_COLORS[tone];
  const isClickable = onClick !== undefined;

  // A zero is not an outcome, so it gets no good/bad mark.
  const hasValue = !(value === 0 || value === '0' || value === '0%');

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-pressed={isClickable ? isSelected : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background:
          isSelected
            ? BC_TOKENS.backgroundSelected
            : isHovered && isClickable
              ? BC_TOKENS.backgroundHover
              : BC_TOKENS.background,
        // One border all around: a toned card is outlined in its tone, so no
        // side reads as missing.
        border: `1px solid ${
          isSelected
            ? BC_TOKENS.accent
            : toneColor === null
              ? BC_TOKENS.borderLight
              : `var(--t-color-${toneColor}7)`
        }`,
        borderRadius: BC_TOKENS.radius,
        boxSizing: 'border-box',
        cursor: isClickable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing(1),
        minWidth: 0,
        overflow: 'hidden',
        padding: `${spacing(3)} ${spacing(4)}`,
      }}
    >
      <span
        style={{
          alignItems: 'center',
          color: BC_TOKENS.textSecondary,
          display: 'flex',
          fontSize: BC_TOKENS.fontSizeSm,
          fontWeight: BC_TOKENS.fontWeightMedium,
          gap: spacing(1),
          justifyContent: 'space-between',
        }}
      >
        <span style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(1.5), minWidth: 0 }}>
          {icon}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </span>
        {metric !== undefined && <BcInfoTip label={label} metric={metric} />}
      </span>
      <span
        style={{
          alignItems: 'center',
          color:
            toneColor === null ? BC_TOKENS.textPrimary : readColorScale(toneColor).ink,
          display: 'flex',
          fontSize: 24,
          fontWeight: BC_TOKENS.fontWeightSemiBold,
          gap: spacing(1.5),
          lineHeight: 1.2,
          minWidth: 0,
        }}
      >
        {tone === 'positive' && hasValue && <IconCheck size={16} aria-hidden="true" />}
        {tone === 'negative' && hasValue && (
          <IconAlertTriangle size={16} aria-hidden="true" />
        )}
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
      </span>
      {(caption !== undefined || actionLabel !== undefined) && (
        <span
          style={{
            alignItems: 'center',
            color: BC_TOKENS.textTertiary,
            display: 'flex',
            fontSize: BC_TOKENS.fontSizeSm,
            gap: spacing(2),
            justifyContent: 'space-between',
          }}
        >
          <span>{caption}</span>
          {actionLabel !== undefined && (
            <span style={{ color: BC_TOKENS.accent, whiteSpace: 'nowrap' }}>
              {actionLabel}
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export const BcKpiGrid = ({
  children,
  minWidth = 200,
}: {
  children: ReactNode;
  minWidth?: number;
}) => (
  <div
    style={{
      display: 'grid',
      gap: spacing(3),
      gridTemplateColumns: `repeat(auto-fill, minmax(min(${minWidth}px, 100%), 1fr))`,
    }}
  >
    {children}
  </div>
);
