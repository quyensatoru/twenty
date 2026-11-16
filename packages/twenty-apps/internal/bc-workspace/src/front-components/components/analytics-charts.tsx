import { t } from 'twenty-sdk/front-component';

import { type AnalyticsTrendBucket } from '../../types/analytics';
import { BC_TOKENS, readColorScale, spacing } from './bc-theme';

const CHART_HEIGHT = 140;

// Bars drawn with divs: the sandbox has no chart library, and two series per
// bucket stay readable with a legend and the count above each bar.
export const AnalyticsTrendChart = ({
  buckets,
}: {
  buckets: AnalyticsTrendBucket[];
}) => {
  const max = Math.max(
    1,
    ...buckets.flatMap((bucket) => [bucket.interactions, bucket.meetings]),
  );
  const interactionColor = readColorScale('blue').solid;
  const meetingColor = readColorScale('purple').solid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
      <div
        style={{
          display: 'flex',
          gap: spacing(3),
          fontSize: BC_TOKENS.fontSizeSm,
          color: BC_TOKENS.textSecondary,
        }}
      >
        <LegendDot color={interactionColor} label={t('BC interactions')} />
        <LegendDot color={meetingColor} label={t('Meetings completed')} />
      </div>
      <div
        role="img"
        aria-label={t('Engagement trend')}
        style={{
          alignItems: 'flex-end',
          borderBottom: `1px solid ${BC_TOKENS.borderLight}`,
          display: 'flex',
          gap: spacing(2),
          height: CHART_HEIGHT + 18,
          overflowX: 'auto',
        }}
      >
        {buckets.map((bucket) => (
          <div
            key={bucket.start}
            title={`${bucket.label}: ${bucket.interactions} / ${bucket.meetings}`}
            style={{
              alignItems: 'flex-end',
              display: 'flex',
              flex: '1 0 28px',
              gap: 2,
              justifyContent: 'center',
              minWidth: 28,
            }}
          >
            <Bar
              value={bucket.interactions}
              max={max}
              color={interactionColor}
            />
            <Bar value={bucket.meetings} max={max} color={meetingColor} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: spacing(2), overflow: 'hidden' }}>
        {buckets.map((bucket) => (
          <span
            key={bucket.start}
            style={{
              color: BC_TOKENS.textTertiary,
              flex: '1 0 28px',
              fontSize: BC_TOKENS.fontSizeXs,
              minWidth: 28,
              overflow: 'hidden',
              textAlign: 'center',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {bucket.label.length > 7 ? bucket.label.slice(5) : bucket.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Bar = ({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      width: 12,
    }}
  >
    <span
      style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeXs }}
    >
      {value}
    </span>
    <span
      style={{
        background: color,
        borderRadius: '2px 2px 0 0',
        display: 'block',
        height: Math.max(
          value === 0 ? 1 : 3,
          Math.round((value / max) * CHART_HEIGHT),
        ),
        opacity: value === 0 ? 0.3 : 1,
        width: '100%',
      }}
    />
  </div>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span
    style={{ alignItems: 'center', display: 'inline-flex', gap: spacing(1.5) }}
  >
    <span
      style={{
        background: color,
        borderRadius: 2,
        display: 'inline-block',
        height: 8,
        width: 8,
      }}
    />
    {label}
  </span>
);

export type BarListItem = {
  key: string;
  label: string;
  hint?: string;
  value: number;
  color: string;
};

export const AnalyticsBarList = ({ items }: { items: BarListItem[] }) => {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
      {items.map((item) => (
        <div
          key={item.key}
          style={{
            alignItems: 'center',
            display: 'grid',
            gap: spacing(3),
            gridTemplateColumns: 'minmax(110px, 160px) 1fr 32px',
          }}
        >
          <span style={{ color: BC_TOKENS.textSecondary, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
            {item.hint !== undefined && (
              <span
                style={{
                  color: BC_TOKENS.textTertiary,
                  display: 'block',
                  fontSize: BC_TOKENS.fontSizeXs,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.hint}
              </span>
            )}
          </span>
          <span
            style={{
              background: BC_TOKENS.backgroundTertiary,
              borderRadius: 3,
              display: 'block',
              height: 6,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                background: item.color,
                display: 'block',
                height: '100%',
                width: `${Math.round((item.value / max) * 100)}%`,
              }}
            />
          </span>
          <span
            style={{
              fontWeight: BC_TOKENS.fontWeightMedium,
              textAlign: 'right',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const AnalyticsCoverageMeter = ({
  share,
  label,
}: {
  share: number | null;
  label: string;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
    <span style={{ fontSize: 24, fontWeight: BC_TOKENS.fontWeightSemiBold }}>
      {share === null ? '—' : `${Math.round(share * 100)}%`}
    </span>
    <span
      style={{ color: BC_TOKENS.textTertiary, fontSize: BC_TOKENS.fontSizeSm }}
    >
      {label}
    </span>
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={share === null ? 0 : Math.round(share * 100)}
      aria-label={label}
      style={{
        background: BC_TOKENS.backgroundTertiary,
        borderRadius: 4,
        display: 'block',
        height: 8,
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          background: readColorScale('green').solid,
          display: 'block',
          height: '100%',
          width: `${share === null ? 0 : Math.min(100, Math.round(share * 100))}%`,
        }}
      />
    </span>
  </div>
);
