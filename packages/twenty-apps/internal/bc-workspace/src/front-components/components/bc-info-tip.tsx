import '../../types/front-component-host-elements';

import { useRef, useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconInfoCircle } from 'twenty-ui/icon';

import { BC_TOKENS, spacing } from './bc-theme';

export type MetricDefinition = {
  definition: string;
  calculation: string;
  timeBasis: string;
  filters?: string;
  attribution?: string;
};

// A tap fires mouseenter right before click; a click this soon after a
// hover-open keeps the tip open instead of toggling it shut.
const HOVER_CLICK_GRACE_MS = 500;

// Opens on hover, keyboard focus and tap alike, so the definition behind a
// number is reachable without a mouse.
export const BcInfoTip = ({
  label,
  metric,
}: {
  label: string;
  metric: MetricDefinition;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverOpenedAt = useRef(0);

  return (
    <span style={{ display: 'inline-flex', position: 'relative' }}>
      <button
        type="button"
        aria-label={t('About {metric}', { metric: label })}
        aria-expanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();

          if (Date.now() - hoverOpenedAt.current < HOVER_CLICK_GRACE_MS) {
            setIsOpen(true);

            return;
          }

          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => {
          if (!isOpen) {
            hoverOpenedAt.current = Date.now();
            setIsOpen(true);
          }
        }}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        style={{
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          color: BC_TOKENS.textTertiary,
          cursor: 'help',
          display: 'inline-flex',
          height: 18,
          justifyContent: 'center',
          padding: 0,
          width: 18,
        }}
      >
        <IconInfoCircle size={14} />
      </button>
      {isOpen && (
        <twenty-overlay offsetY={22} onClose={() => setIsOpen(false)}>
          <div
            role="tooltip"
            style={{
              background: BC_TOKENS.background,
              border: `1px solid ${BC_TOKENS.border}`,
              borderRadius: BC_TOKENS.radius,
              boxShadow: BC_TOKENS.shadow,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: BC_TOKENS.fontFamily,
              fontSize: BC_TOKENS.fontSizeSm,
              gap: spacing(2),
              lineHeight: 1.45,
              maxWidth: 340,
              padding: spacing(3),
              width: 340,
            }}
          >
            <span
              style={{
                color: BC_TOKENS.textPrimary,
                fontWeight: BC_TOKENS.fontWeightSemiBold,
              }}
            >
              {label}
            </span>
            <span style={{ color: BC_TOKENS.textSecondary }}>
              {t(metric.definition)}
            </span>
            <TipRow label={t('Calculation')} value={t(metric.calculation)} />
            <TipRow label={t('Time basis')} value={t(metric.timeBasis)} />
            {metric.filters !== undefined && (
              <TipRow label={t('Filters')} value={t(metric.filters)} />
            )}
            {metric.attribution !== undefined && (
              <TipRow label={t('Attribution')} value={t(metric.attribution)} />
            )}
          </div>
        </twenty-overlay>
      )}
    </span>
  );
};

const TipRow = ({ label, value }: { label: string; value: string }) => (
  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span
      style={{
        color: BC_TOKENS.textTertiary,
        fontWeight: BC_TOKENS.fontWeightMedium,
      }}
    >
      {label}
    </span>
    <span style={{ color: BC_TOKENS.textSecondary }}>{value}</span>
  </span>
);
