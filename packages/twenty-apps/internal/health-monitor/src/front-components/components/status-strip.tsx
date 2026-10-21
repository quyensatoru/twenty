import { t } from 'twenty-sdk/front-component';

import { type HealthDashboardNode } from '../../types/health-dashboard';
import { type HealthLevel } from '../../types/health-dashboard';
import { useIsMobile } from '../hooks/use-is-mobile';
import {
  formatClock,
  formatDateTime,
  formatPercent,
} from '../utils/format-health.util';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';

type StatusStripProps = {
  nodes: HealthDashboardNode[];
  startAt: string;
  endAt: string;
  onSelectNode: (nodeKey: string) => void;
};

const LEGEND = ['OK', 'WARNING', 'CRITICAL', 'NONE'] as const;

const LEVEL_RANK: Record<HealthLevel, number> = {
  NONE: -1,
  OK: 0,
  WARNING: 1,
  CRITICAL: 2,
};

// Halves the cell count by keeping the worse of each pair, so a phone shows
// the same day without a sideways scroll.
const mergeCellPairs = (cells: HealthLevel[]): HealthLevel[] =>
  Array.from({ length: Math.ceil(cells.length / 2) }, (_, index) => {
    const [first, second = 'NONE'] = cells.slice(index * 2, index * 2 + 2);

    return LEVEL_RANK[first] >= LEVEL_RANK[second] ? first : second;
  });

export const StatusStrip = ({
  nodes,
  startAt,
  endAt,
  onSelectNode,
}: StatusStripProps) => {
  const isMobile = useIsMobile();
  // Phones put the name above its cells, so the strip keeps the full width.
  const labelWidth = isMobile ? 0 : 150;
  const startMs = Date.parse(startAt);
  const spanMs = Date.parse(endAt) - startMs;
  const format = spanMs > 26 * 3_600_000 ? formatDateTime : formatClock;
  const tickRatios = isMobile ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  const cellTime = (index: number, count: number) =>
    format(new Date(startMs + (spanMs * index) / count).toISOString());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3) }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing(4),
          fontSize: HEALTH_TOKENS.fontSizeSm,
          color: HEALTH_TOKENS.textSecondary,
        }}
      >
        {LEGEND.map((level) => (
          <span
            key={level}
            style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: HEALTH_TOKENS.radiusSmall,
                background: LEVEL_STYLES[level].fill,
              }}
            />
            {level === 'NONE'
              ? t('No response / no data')
              : t(LEVEL_STYLES[level].label)}
          </span>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            minWidth: isMobile ? 0 : 720,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(1.5),
          }}
        >
          {nodes.map((node) => {
            const cells = isMobile ? mergeCellPairs(node.cells) : node.cells;

            return (
              <button
                key={node.key}
                type="button"
                onClick={() => onSelectNode(node.key)}
                style={{
                  display: 'flex',
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  alignItems: 'center',
                  columnGap: spacing(3),
                  rowGap: spacing(1),
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  color: HEALTH_TOKENS.textPrimary,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: isMobile ? '100%' : labelWidth,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    fontWeight: HEALTH_TOKENS.fontWeightMedium,
                    opacity: node.isMuted ? 0.5 : 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {node.label}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
                    gap: 2,
                  }}
                >
                  {cells.map((level, index) => (
                    <span
                      key={index}
                      title={`${node.label} · ${cellTime(index, cells.length)} · ${t(LEVEL_STYLES[level].label)}`}
                      style={{
                        height: 20,
                        borderRadius: HEALTH_TOKENS.radiusSmall,
                        background: LEVEL_STYLES[level].fill,
                      }}
                    />
                  ))}
                </span>
                <span
                  style={{
                    width: isMobile ? 48 : 60,
                    textAlign: 'right',
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                    color: HEALTH_TOKENS.textSecondary,
                  }}
                >
                  {formatPercent(node.uptimePercent, isMobile ? 1 : 2)}
                </span>
              </button>
            );
          })}
          <div
            style={{
              display: 'flex',
              gap: spacing(3),
              fontSize: HEALTH_TOKENS.fontSizeXs,
              color: HEALTH_TOKENS.textTertiary,
            }}
          >
            {!isMobile && <span style={{ width: labelWidth }} />}
            <span
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {tickRatios.map((ratio) => (
                <span key={ratio}>
                  {format(new Date(startMs + spanMs * ratio).toISOString())}
                </span>
              ))}
            </span>
            <span style={{ width: isMobile ? 48 : 60, textAlign: 'right' }}>
              {t('healthy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
