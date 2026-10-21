import { useState } from 'react';
import { t } from 'twenty-sdk/front-component';
import { Card } from 'twenty-ui/primitives/surfaces';

import {
  type HealthDashboardData,
  type HealthLevel,
} from '../../types/health-dashboard';
import { type HealthAppOverview } from '../../types/health-route-results';
import { useIsMobile } from '../hooks/use-is-mobile';
import {
  formatCount,
  formatMilliseconds,
  formatPercent,
} from '../utils/format-health.util';
import { AreaChart } from './area-chart';
import { HealthCard } from './health-card';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';
import { IncidentTimeline } from './incident-timeline';
import { NodeCard } from './node-card';
import { OpenIncidents } from './open-incidents';
import { ProcessMatrix } from './process-matrix';
import { StatTile } from './stat-tile';
import { StatusStrip } from './status-strip';

type DashboardViewProps = {
  app: HealthAppOverview;
  dashboard: HealthDashboardData;
  nowMs: number;
  onSelectNode: (nodeKey: string) => void;
  onAcknowledge: (incidentId: string) => void;
  acknowledgingId: string | null;
};

const latencyTicks = (
  values: (number | null)[],
): { max: number; ticks: number[] } => {
  const peak = Math.max(
    100,
    ...values.filter((value): value is number => value !== null),
  );
  const step = peak <= 300 ? 100 : peak <= 1500 ? 250 : 1000;
  const max = Math.ceil((peak * 1.1) / step) * step;
  const ticks = Array.from(
    { length: Math.floor(max / step) + 1 },
    (_, index) => index * step,
  );

  return {
    max,
    ticks:
      ticks.length <= 5 ? ticks : ticks.filter((_, index) => index % 2 === 0),
  };
};

export const DashboardView = ({
  app,
  dashboard,
  nowMs,
  onSelectNode,
  onAcknowledge,
  acknowledgingId,
}: DashboardViewProps) => {
  const [latencyHover, setLatencyHover] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const openIncidents = dashboard.incidents.filter(
    (incident) =>
      incident.status === 'OPEN' || incident.status === 'ACKNOWLEDGED',
  );
  const criticalCount = openIncidents.filter(
    (incident) => incident.severity === 'CRITICAL',
  ).length;
  const level: HealthLevel =
    app.monitor?.lastStatus === 'UNREACHABLE' || criticalCount > 0
      ? 'CRITICAL'
      : openIncidents.length > 0 || app.monitor?.lastStatus === 'WARNING'
        ? 'WARNING'
        : app.monitor?.lastStatus == null
          ? 'NONE'
          : 'OK';
  const healthyNodes = dashboard.nodes.filter(
    (node) => node.level === 'OK',
  ).length;
  const processes = dashboard.nodes.flatMap((node) => node.processes);
  const onlineProcesses = processes.filter(
    (process) => process.status === 'online',
  ).length;
  const { max: latencyMax, ticks } = latencyTicks(dashboard.latency);
  const headline =
    app.monitor?.lastStatus === 'UNREACHABLE'
      ? t('Endpoint not responding: {error}', {
          error: app.monitor.lastError ?? '',
        })
      : openIncidents.length > 0
        ? t('Open incidents: {count} · {healthy} of {total} nodes healthy', {
            count: openIncidents.length,
            healthy: healthyNodes,
            total: dashboard.nodes.length,
          })
        : t(
            '{healthy} of {total} nodes healthy · {online} of {processes} processes online',
            {
              healthy: healthyNodes,
              total: dashboard.nodes.length,
              online: onlineProcesses,
              processes: processes.length,
            },
          );
  // Phones merge cells in pairs, so each one covers twice the time.
  const cellMinutes = Math.round(
    (Date.parse(dashboard.endAt) - Date.parse(dashboard.startAt)) /
      (isMobile ? 24 : 48) /
      60_000,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(4) }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 140 : 180}px, 1fr))`,
          gap: spacing(3),
        }}
      >
        <div
          style={{
            gridColumn: isMobile ? '1 / -1' : 'span 2',
            minWidth: 0,
            display: 'flex',
          }}
        >
          <Card.Root rounded fullWidth>
            <Card.Content>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(4),
                  width: '100%',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: HEALTH_TOKENS.radius,
                    background: LEVEL_STYLES[level].soft,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: LEVEL_STYLES[level].line,
                    }}
                  />
                </span>
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing(1),
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: HEALTH_TOKENS.fontSizeSm,
                      color: HEALTH_TOKENS.textSecondary,
                    }}
                  >
                    {t('System status')}
                  </span>
                  <span
                    style={{
                      fontSize: HEALTH_TOKENS.fontSizeXl,
                      fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                      color: LEVEL_STYLES[level].ink,
                    }}
                  >
                    {t(LEVEL_STYLES[level].label)}
                  </span>
                  <span
                    style={{
                      color: HEALTH_TOKENS.textSecondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {headline}
                  </span>
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        </div>
        <StatTile
          label={t('Endpoint uptime')}
          value={formatPercent(dashboard.stats.uptimePercent, 2)}
          note={t('{count} failed polls', {
            count: dashboard.stats.pollCount - dashboard.stats.answeredCount,
          })}
        />
        <StatTile
          label={t('Successful polls')}
          value={formatCount(dashboard.stats.answeredCount)}
          note={t('out of {count}', {
            count: formatCount(dashboard.stats.pollCount),
          })}
        />
        <StatTile
          label={t('p95 latency')}
          value={formatMilliseconds(dashboard.stats.latencyP95)}
          note={t('latest {value}', {
            value: formatMilliseconds(app.monitor?.lastLatencyMs),
          })}
        />
        <StatTile
          label={t('Process restarts')}
          value={String(dashboard.stats.restartCount)}
          note={t('{online} of {total} processes online', {
            online: onlineProcesses,
            total: processes.length,
          })}
          valueColor={
            dashboard.stats.restartCount > 0
              ? LEVEL_STYLES.WARNING.ink
              : undefined
          }
        />
      </div>

      <HealthCard
        title={t('Status by node')}
        subtitle={t(
          'One cell per {minutes} minutes, worst state wins. Click a row for details.',
          { minutes: cellMinutes },
        )}
      >
        {dashboard.nodes.length === 0 ? (
          <span style={{ color: HEALTH_TOKENS.textTertiary }}>
            {t(
              'No snapshot with nodes yet. Check the endpoint and the header secret.',
            )}
          </span>
        ) : (
          <StatusStrip
            nodes={dashboard.nodes}
            startAt={dashboard.startAt}
            endAt={dashboard.endAt}
            onSelectNode={onSelectNode}
          />
        )}
      </HealthCard>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing(4),
          alignItems: 'stretch',
        }}
      >
        <div style={{ flex: '999 1 560px', minWidth: 0, display: 'flex' }}>
          <HealthCard
            title={t('Endpoint latency')}
            subtitle={t(
              'Milliseconds, averaged per {minutes} minutes. Gaps mean no response.',
              { minutes: dashboard.bucketMinutes },
            )}
            aside={
              <span
                style={{
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                  color: HEALTH_TOKENS.textSecondary,
                  fontWeight: 'normal',
                }}
              >
                p95 {formatMilliseconds(dashboard.stats.latencyP95)}
              </span>
            }
          >
            <AreaChart
              values={dashboard.latency}
              maxValue={latencyMax}
              yTicks={ticks}
              formatValue={(value) => `${Math.round(value)}`}
              startAt={dashboard.startAt}
              endAt={dashboard.endAt}
              bucketMinutes={dashboard.bucketMinutes}
              height={isMobile ? 140 : 180}
              hoverIndex={latencyHover}
              onHoverIndexChange={setLatencyHover}
            />
          </HealthCard>
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex' }}>
          <HealthCard title={t('Open incidents')}>
            <OpenIncidents
              nodeLabels={dashboard.nodeLabels}
              incidents={dashboard.incidents}
              nowMs={nowMs}
              onAcknowledge={onAcknowledge}
              acknowledgingId={acknowledgingId}
            />
          </HealthCard>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing(4),
          alignItems: 'flex-start',
        }}
      >
        <section
          style={{
            flex: '999 1 620px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(2.5),
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: spacing(2),
            }}
          >
            <span style={{ fontWeight: HEALTH_TOKENS.fontWeightSemiBold }}>
              {t('Nodes')}
            </span>
            <span
              style={{
                fontSize: HEALTH_TOKENS.fontSizeSm,
                color: HEALTH_TOKENS.textTertiary,
              }}
            >
              {t('Line: warning threshold · scale 0 to 100%')}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(min(290px, 100%), 1fr))',
              gap: spacing(3),
            }}
          >
            {dashboard.nodes.map((node) => (
              <NodeCard
                key={node.key}
                node={node}
                onSelect={() => onSelectNode(node.key)}
              />
            ))}
          </div>
        </section>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex' }}>
          <HealthCard
            title={t('pm2 processes')}
            aside={
              <span
                style={{
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                  color: HEALTH_TOKENS.textSecondary,
                  fontWeight: 'normal',
                }}
              >
                {t('{online} of {total} online', {
                  online: onlineProcesses,
                  total: processes.length,
                })}
              </span>
            }
          >
            <ProcessMatrix
              nodes={dashboard.nodes}
              onSelectNode={onSelectNode}
            />
          </HealthCard>
        </div>
      </div>

      <HealthCard
        title={t('Incidents and events')}
        subtitle={t(
          'Bars: time an incident stayed open. Blue dots: process restarts.',
        )}
      >
        <IncidentTimeline
          nodeLabels={dashboard.nodeLabels}
          incidents={dashboard.incidents}
          startAt={dashboard.startAt}
          endAt={dashboard.endAt}
        />
      </HealthCard>
    </div>
  );
};
