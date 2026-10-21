import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { IconChevronLeft, IconServer } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Button } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';

import {
  type HealthDashboardData,
  type HealthDashboardNode,
} from '../../types/health-dashboard';
import { useIsMobile } from '../hooks/use-is-mobile';
import {
  formatDuration,
  formatMegabytes,
  formatPercent,
} from '../utils/format-health.util';
import { AreaChart, type ChartThreshold } from './area-chart';
import { HealthCard } from './health-card';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';
import { LevelTag } from './level-status';
import { OpenIncidents } from './open-incidents';
import { Sparkline } from './sparkline';

type NodeDetailViewProps = {
  node: HealthDashboardNode;
  dashboard: HealthDashboardData;
  nowMs: number;
  onBack: () => void;
  onAcknowledge: (incidentId: string) => void;
  acknowledgingId: string | null;
};

const toThresholds = (threshold: {
  warning: number | null;
  critical: number | null;
}): ChartThreshold[] => [
  ...(threshold.warning === null
    ? []
    : [{ value: threshold.warning, level: 'WARNING' as const }]),
  ...(threshold.critical === null
    ? []
    : [{ value: threshold.critical, level: 'CRITICAL' as const }]),
];

const minMax = (values: (number | null)[]) => {
  const present = values.filter((value): value is number => value !== null);

  return present.length === 0
    ? null
    : { min: Math.min(...present), max: Math.max(...present) };
};

const cellStyle = {
  padding: spacing(2.5),
  borderBottom: `1px solid ${HEALTH_TOKENS.borderLight}`,
} as const;

export const NodeDetailView = ({
  node,
  dashboard,
  nowMs,
  onBack,
  onAcknowledge,
  acknowledgingId,
}: NodeDetailViewProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const incidents = dashboard.incidents.filter(
    (incident) => incident.nodeKey === node.key,
  );
  const charts = [
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
  const facts = [
    node.key,
    node.host,
    t('uptime {duration}', {
      duration: formatDuration(node.current.uptimeSeconds),
    }),
    `RAM ${formatMegabytes(node.current.memoryUsedMegabytes)} / ${formatMegabytes(node.current.memoryTotalMegabytes)}`,
    node.current.diskUsedGigabytes === null
      ? null
      : `Disk ${formatMegabytes(node.current.diskUsedGigabytes * 1024)} / ${formatMegabytes((node.current.diskTotalGigabytes ?? 0) * 1024)}`,
  ].filter((part) => part !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(4) }}>
      <div>
        <Button
          variant="ghost"
          color="neutral"
          size="sm"
          startIcon={<IconChevronLeft size={16} />}
          onClick={onBack}
        >
          {t('All nodes')}
        </Button>
      </div>

      <Card.Root rounded fullWidth>
        <Card.Content>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: spacing(4),
              width: '100%',
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: HEALTH_TOKENS.radius,
                background: HEALTH_TOKENS.backgroundTertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: HEALTH_TOKENS.textSecondary,
              }}
            >
              <IconServer size={20} />
            </span>
            <span
              style={{
                flex: '1 1 260px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing(1),
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(2),
                }}
              >
                <span
                  style={{
                    fontSize: HEALTH_TOKENS.fontSizeLg,
                    fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                  }}
                >
                  {node.label}
                </span>
                <LevelTag level={node.level} />
              </span>
              <span style={{ color: HEALTH_TOKENS.textSecondary }}>
                {facts.join(' · ')}
              </span>
            </span>
            <span
              style={{
                display: 'flex',
                gap: isMobile ? spacing(4) : spacing(6),
                width: isMobile ? '100%' : undefined,
                justifyContent: isMobile ? 'space-between' : undefined,
              }}
            >
              {charts.map((chart) => (
                <span
                  key={chart.label}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <span
                    style={{
                      fontSize: HEALTH_TOKENS.fontSizeSm,
                      color: HEALTH_TOKENS.textSecondary,
                    }}
                  >
                    {chart.label}
                  </span>
                  <span
                    style={{
                      fontSize: HEALTH_TOKENS.fontSizeXl,
                      fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                    }}
                  >
                    {formatPercent(chart.current)}
                  </span>
                </span>
              ))}
            </span>
          </div>
        </Card.Content>
      </Card.Root>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing(4),
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            flex: '999 1 600px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(3),
          }}
        >
          {charts.map((chart) => {
            const range = minMax(chart.values);

            return (
              <HealthCard
                key={chart.label}
                title={`${chart.label} (%)`}
                aside={
                  <span
                    style={{
                      display: 'flex',
                      gap: spacing(3.5),
                      fontSize: HEALTH_TOKENS.fontSizeSm,
                      color: HEALTH_TOKENS.textSecondary,
                      fontWeight: 'normal',
                    }}
                  >
                    <span>
                      {t('min {value}', {
                        value: formatPercent(range?.min ?? null),
                      })}
                    </span>
                    <span>
                      {t('max {value}', {
                        value: formatPercent(range?.max ?? null),
                      })}
                    </span>
                    <span>
                      {t('now {value}', {
                        value: formatPercent(chart.current),
                      })}
                    </span>
                  </span>
                }
              >
                <AreaChart
                  values={chart.values}
                  maxValue={100}
                  yTicks={[0, 50, 100]}
                  formatValue={(value) =>
                    formatPercent(value, value % 1 === 0 ? 0 : 1)
                  }
                  thresholds={toThresholds(chart.threshold)}
                  startAt={dashboard.startAt}
                  endAt={dashboard.endAt}
                  bucketMinutes={dashboard.bucketMinutes}
                  height={isMobile ? 120 : 150}
                  hoverIndex={hoverIndex}
                  onHoverIndexChange={setHoverIndex}
                />
              </HealthCard>
            );
          })}
        </div>
        <div
          style={{
            flex: '1 1 300px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(3),
          }}
        >
          <HealthCard title={t('Open incidents')}>
            <OpenIncidents
              nodeLabels={dashboard.nodeLabels}
              incidents={incidents}
              nowMs={nowMs}
              onAcknowledge={onAcknowledge}
              acknowledgingId={acknowledgingId}
            />
          </HealthCard>
          <HealthCard title={t('Thresholds in use')}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: `${spacing(2)} ${spacing(3.5)}`,
                color: HEALTH_TOKENS.textSecondary,
              }}
            >
              {charts.map((chart) => (
                <span key={chart.label} style={{ display: 'contents' }}>
                  <span>{chart.label}</span>
                  <span style={{ color: LEVEL_STYLES.WARNING.ink }}>
                    {formatPercent(chart.threshold.warning, 0)}
                  </span>
                  <span style={{ color: LEVEL_STYLES.CRITICAL.ink }}>
                    {formatPercent(chart.threshold.critical, 0)}
                  </span>
                </span>
              ))}
            </div>
          </HealthCard>
        </div>
      </div>

      <HealthCard
        title={t('Processes on this node')}
        aside={
          <span
            style={{
              fontSize: HEALTH_TOKENS.fontSizeSm,
              color: HEALTH_TOKENS.textSecondary,
              fontWeight: 'normal',
            }}
          >
            {t('{online} of {total} online', {
              online: node.processes.filter(
                (process) => process.status === 'online',
              ).length,
              total: node.processes.length,
            })}
          </span>
        }
      >
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.processes.map((process) => (
              <div
                key={process.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing(1.5),
                  padding: `${spacing(2.5)} 0`,
                  borderTop: `1px solid ${HEALTH_TOKENS.borderLight}`,
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
                  <span
                    style={{ fontWeight: HEALTH_TOKENS.fontWeightSemiBold }}
                  >
                    {process.name}{' '}
                    <span
                      style={{
                        fontWeight: 'normal',
                        color: HEALTH_TOKENS.textTertiary,
                      }}
                    >
                      pm2 {process.pm2Id ?? '-'}
                    </span>
                  </span>
                  <Tag
                    color={process.status === 'online' ? 'green' : 'red'}
                    weight="medium"
                    preventShrink
                  >
                    {process.status}
                  </Tag>
                </div>
                <span
                  style={{
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                    color: HEALTH_TOKENS.textSecondary,
                  }}
                >
                  {`CPU ${formatPercent(process.cpuPercent)} · RAM ${formatMegabytes(process.memoryMegabytes)} · ${t('uptime {duration}', { duration: formatDuration(process.uptimeSeconds) })}`}
                </span>
                <span
                  style={{
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                    color:
                      process.restartsInRange > 0
                        ? LEVEL_STYLES.WARNING.ink
                        : HEALTH_TOKENS.textTertiary,
                  }}
                >
                  {t('Restarts (total / in range)')}: {process.restarts ?? '–'}{' '}
                  / {process.restartsInRange}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                minWidth: 720,
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    color: HEALTH_TOKENS.textSecondary,
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                  }}
                >
                  {[
                    t('Process'),
                    t('Status'),
                    t('RAM over range'),
                    'CPU',
                    t('Restarts (total / in range)'),
                    t('Uptime'),
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        ...cellStyle,
                        fontWeight: HEALTH_TOKENS.fontWeightMedium,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {node.processes.map((process) => {
                  const memoryMax =
                    Math.max(
                      1,
                      ...process.memorySeries.filter(
                        (value): value is number => value !== null,
                      ),
                    ) * 1.2;

                  return (
                    <tr key={process.key}>
                      <td style={cellStyle}>
                        <span
                          style={{ display: 'flex', flexDirection: 'column' }}
                        >
                          <span
                            style={{
                              fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                            }}
                          >
                            {process.name}
                          </span>
                          <span
                            style={{
                              fontSize: HEALTH_TOKENS.fontSizeSm,
                              color: HEALTH_TOKENS.textTertiary,
                            }}
                          >
                            pm2 {process.pm2Id ?? '-'}
                          </span>
                        </span>
                      </td>
                      <td style={cellStyle}>
                        <Tag
                          color={process.status === 'online' ? 'green' : 'red'}
                          weight="medium"
                          preventShrink
                        >
                          {process.status}
                        </Tag>
                      </td>
                      <td style={{ ...cellStyle, width: '32%' }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing(2.5),
                          }}
                        >
                          <Sparkline
                            values={process.memorySeries}
                            maxValue={memoryMax}
                            height={24}
                          />
                          <span style={{ width: 64, textAlign: 'right' }}>
                            {formatMegabytes(process.memoryMegabytes)}
                          </span>
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {formatPercent(process.cpuPercent)}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color:
                            process.restartsInRange > 0
                              ? LEVEL_STYLES.WARNING.ink
                              : HEALTH_TOKENS.textPrimary,
                        }}
                      >
                        {process.restarts ?? '–'} / {process.restartsInRange}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: HEALTH_TOKENS.textSecondary,
                        }}
                      >
                        {formatDuration(process.uptimeSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </HealthCard>
    </div>
  );
};
