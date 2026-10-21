import { t } from 'twenty-sdk/front-component';

import { type HealthLevel } from '../../types/health-dashboard';
import { useIsMobile } from '../hooks/use-is-mobile';
import { bucketTime, buildSeriesPath } from '../utils/build-series-path.util';
import { formatClock, formatDateTime } from '../utils/format-health.util';
import { HEALTH_TOKENS, LEVEL_STYLES } from './health-tokens';

export type ChartThreshold = {
  value: number;
  level: Extract<HealthLevel, 'WARNING' | 'CRITICAL'>;
};

type AreaChartProps = {
  values: (number | null)[];
  maxValue: number;
  yTicks: number[];
  formatValue: (value: number) => string;
  thresholds?: ChartThreshold[];
  startAt: string;
  endAt: string;
  bucketMinutes: number;
  height: number;
  hoverIndex: number | null;
  onHoverIndexChange: (index: number | null) => void;
  color?: string;
  emptyLabel?: string;
};

const HOVER_ZONES = 72;

export const AreaChart = ({
  values,
  maxValue,
  yTicks,
  formatValue,
  thresholds = [],
  startAt,
  endAt,
  bucketMinutes,
  height,
  hoverIndex,
  onHoverIndexChange,
  color = HEALTH_TOKENS.accent,
  emptyLabel,
}: AreaChartProps) => {
  const count = values.length;
  const { line, area } = buildSeriesPath(values, maxValue);
  const zoneCount = Math.min(count, HOVER_ZONES);
  const hoveredValue = hoverIndex === null ? null : values[hoverIndex];
  const left = (index: number) =>
    count <= 1 ? 0 : (index / (count - 1)) * 100;
  const spanMs = Date.parse(endAt) - Date.parse(startAt);
  const isMobile = useIsMobile();
  const xTicks = (isMobile ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]).map(
    (ratio) => {
      const iso = new Date(Date.parse(startAt) + spanMs * ratio).toISOString();

      return spanMs > 26 * 3_600_000 ? formatDateTime(iso) : formatClock(iso);
    },
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height,
            width: 40,
            fontSize: HEALTH_TOKENS.fontSizeXs,
            color: HEALTH_TOKENS.textTertiary,
            textAlign: 'right',
          }}
        >
          {[...yTicks].reverse().map((tick) => (
            <span key={tick} style={{ lineHeight: '11px' }}>
              {formatValue(tick)}
            </span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', height }}>
          {yTicks.map((tick) => (
            <div
              key={tick}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${100 - (tick / maxValue) * 100}%`,
                borderTop: `1px solid ${tick === 0 ? HEALTH_TOKENS.borderStrong : HEALTH_TOKENS.borderLight}`,
              }}
            />
          ))}
          {thresholds.map((threshold) => (
            <div
              key={threshold.level}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${100 - (Math.min(threshold.value, maxValue) / maxValue) * 100}%`,
                borderTop: `1px solid ${LEVEL_STYLES[threshold.level].line}`,
                opacity: 0.7,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  right: 4,
                  top: threshold.level === 'CRITICAL' ? -16 : 2,
                  lineHeight: '14px',
                  fontSize: HEALTH_TOKENS.fontSizeXs,
                  color: LEVEL_STYLES[threshold.level].ink,
                  background: HEALTH_TOKENS.background,
                  padding: '0 4px',
                }}
              >
                {threshold.level === 'CRITICAL'
                  ? t('critical {value}', {
                      value: formatValue(threshold.value),
                    })
                  : t('warning {value}', {
                      value: formatValue(threshold.value),
                    })}
              </span>
            </div>
          ))}
          {line.length === 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: HEALTH_TOKENS.textTertiary,
                fontSize: HEALTH_TOKENS.fontSizeSm,
              }}
            >
              {emptyLabel ?? t('No data in this range')}
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${Math.max(1, count - 1)} 100`}
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              <path d={area} fill={color} fillOpacity={0.1} stroke="none" />
              <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}
          {hoverIndex !== null && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${left(hoverIndex)}%`,
                  borderLeft: `1px solid ${HEALTH_TOKENS.textTertiary}`,
                  pointerEvents: 'none',
                }}
              />
              {hoveredValue !== null && hoveredValue !== undefined && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${left(hoverIndex)}%`,
                    top: `${100 - (Math.min(hoveredValue, maxValue) / maxValue) * 100}%`,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: color,
                    boxShadow: `0 0 0 2px ${HEALTH_TOKENS.background}`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: `${left(hoverIndex)}%`,
                  transform:
                    left(hoverIndex) > 75
                      ? 'translateX(calc(-100% - 8px))'
                      : 'translateX(8px)',
                  display: 'flex',
                  gap: 8,
                  padding: '5px 10px',
                  borderRadius: HEALTH_TOKENS.radiusSmall,
                  background: HEALTH_TOKENS.tooltipBackground,
                  color: HEALTH_TOKENS.tooltipText,
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ opacity: 0.7 }}>
                  {formatClock(bucketTime(startAt, bucketMinutes, hoverIndex))}
                </span>
                <b>
                  {hoveredValue === null || hoveredValue === undefined
                    ? t('no data')
                    : formatValue(hoveredValue)}
                </b>
              </div>
            </>
          )}
          <div
            style={{ position: 'absolute', inset: 0, display: 'flex' }}
            onMouseLeave={() => onHoverIndexChange(null)}
          >
            {Array.from({ length: zoneCount }, (_, zone) => (
              <div
                key={zone}
                style={{ flex: 1, height: '100%', cursor: 'crosshair' }}
                onMouseEnter={() =>
                  onHoverIndexChange(
                    Math.min(
                      count - 1,
                      Math.round(((zone + 0.5) / zoneCount) * count - 0.5),
                    ),
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingLeft: 48,
          fontSize: HEALTH_TOKENS.fontSizeXs,
          color: HEALTH_TOKENS.textTertiary,
        }}
      >
        {xTicks.map((tick, index) => (
          <span key={index}>{tick}</span>
        ))}
      </div>
    </div>
  );
};
