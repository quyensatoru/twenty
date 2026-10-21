import { t } from 'twenty-sdk/front-component';
import { Card } from 'twenty-ui/primitives/surfaces';

import {
  type HealthDashboardNode,
  type HealthLevel,
} from '../../types/health-dashboard';
import { formatPercent } from '../utils/format-health.util';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';
import { LevelTag } from './level-status';
import { Sparkline } from './sparkline';

type NodeCardProps = { node: HealthDashboardNode; onSelect: () => void };

const levelOf = (
  value: number | null,
  threshold: { warning: number | null; critical: number | null },
): HealthLevel => {
  if (
    value !== null &&
    threshold.critical !== null &&
    value >= threshold.critical
  )
    return 'CRITICAL';
  if (
    value !== null &&
    threshold.warning !== null &&
    value >= threshold.warning
  )
    return 'WARNING';

  return 'OK';
};

export const NodeCard = ({ node, onSelect }: NodeCardProps) => {
  const metrics = [
    {
      label: 'CPU',
      values: node.series.cpu,
      current: node.current.cpuPercent,
      threshold: node.thresholds.cpu,
    },
    {
      label: 'RAM',
      values: node.series.memory,
      current: node.current.memoryPercent,
      threshold: node.thresholds.memory,
    },
    {
      label: 'Disk',
      values: node.series.disk,
      current: node.current.diskPercent,
      threshold: node.thresholds.disk,
    },
  ];
  const isMissing = node.current.status === 'missing';

  return (
    <Card.Root
      rounded
      fullWidth
      style={{ minWidth: 0, opacity: node.isMuted ? 0.6 : 1 }}
    >
      <Card.Content isClickable hasHoverHighlight onClick={onSelect}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(3),
            width: '100%',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing(2),
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: 0,
              }}
            >
              <span style={{ fontWeight: HEALTH_TOKENS.fontWeightSemiBold }}>
                {node.label}
              </span>
              <span
                style={{
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                  color: HEALTH_TOKENS.textTertiary,
                }}
              >
                {node.key} · {node.host ?? '–'} ·{' '}
                {t('{count} processes', { count: node.processes.length })}
                {node.isMuted ? ` · ${t('alerts muted')}` : ''}
              </span>
            </div>
            <LevelTag
              level={isMissing ? 'CRITICAL' : node.level}
              label={isMissing ? t('Missing') : undefined}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(2),
            }}
          >
            {metrics.map((metric) => {
              const level = levelOf(metric.current, metric.threshold);

              return (
                <div
                  key={metric.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(2.5),
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      fontSize: HEALTH_TOKENS.fontSizeSm,
                      color: HEALTH_TOKENS.textSecondary,
                    }}
                  >
                    {metric.label}
                  </span>
                  <Sparkline
                    values={metric.values}
                    maxValue={100}
                    height={28}
                    warningValue={metric.threshold.warning}
                  />
                  <span
                    style={{
                      width: 52,
                      textAlign: 'right',
                      fontWeight:
                        level === 'OK'
                          ? HEALTH_TOKENS.fontWeightMedium
                          : HEALTH_TOKENS.fontWeightSemiBold,
                      color:
                        level === 'OK'
                          ? HEALTH_TOKENS.textPrimary
                          : LEVEL_STYLES[level].ink,
                    }}
                  >
                    {formatPercent(metric.current)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  );
};
