import { useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { AppPath, navigate, t, useRecordId } from 'twenty-sdk/front-component';
import { IconHeartRateMonitor } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';
import { Card } from 'twenty-ui/primitives/surfaces';

import { APP_HEALTH_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type HealthLevel } from '../types/health-dashboard';
import { ConfigLoader } from './components/config-loader';
import { HealthThemeRoot } from './components/health-theme-root';
import {
  HEALTH_TOKENS,
  LEVEL_STYLES,
  spacing,
} from './components/health-tokens';
import { LevelTag } from './components/level-status';
import { SkeletonBar, SkeletonPulse } from './components/skeleton';
import { useHealthDashboard } from './hooks/use-health-dashboard';
import { useHealthOverview } from './hooks/use-health-overview';
import { describeIncidentLabel } from './utils/describe-incident-label.util';
import { formatClock, formatPercent } from './utils/format-health.util';

const LEVEL_RANK: Record<HealthLevel, number> = {
  NONE: -1,
  OK: 0,
  WARNING: 1,
  CRITICAL: 2,
};

const Metric = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) => (
  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
    <span
      style={{
        fontSize: HEALTH_TOKENS.fontSizeSm,
        color: HEALTH_TOKENS.textSecondary,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: HEALTH_TOKENS.fontSizeLg,
        fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
        color: color ?? HEALTH_TOKENS.textPrimary,
      }}
    >
      {value}
    </span>
  </span>
);

const AppHealth = () => {
  const appId = useRecordId() ?? null;
  const overview = useHealthOverview(appId);
  const app = overview.apps[0] ?? null;
  const dashboard = useHealthDashboard(
    app?.monitor?.isEnabled === true ? app.monitor.id : null,
    24,
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const data = dashboard.data?.dashboard ?? null;
  const canConfigure = app?.canConfigure === true;

  const cells: HealthLevel[] =
    data === null
      ? []
      : Array.from({ length: 48 }, (_, index) =>
          data.nodes.reduce<HealthLevel>((worst, node) => {
            const level = node.cells[index] ?? 'NONE';

            return LEVEL_RANK[level] > LEVEL_RANK[worst] ? level : worst;
          }, 'NONE'),
        );
  const openIncidents = (data?.incidents ?? []).filter(
    (incident) =>
      incident.status === 'OPEN' || incident.status === 'ACKNOWLEDGED',
  );
  const healthyNodes =
    data?.nodes.filter((node) => node.level === 'OK').length ?? 0;
  const processes = data?.nodes.flatMap((node) => node.processes) ?? [];
  const level: HealthLevel =
    app?.monitor == null || !app.monitor.isEnabled
      ? 'NONE'
      : app.monitor.lastStatus === 'UNREACHABLE' ||
          app.monitor.criticalIncidentCount > 0
        ? 'CRITICAL'
        : app.monitor.openIncidentCount > 0 ||
            app.monitor.lastStatus === 'WARNING'
          ? 'WARNING'
          : 'OK';

  return (
    <HealthThemeRoot>
      <Card.Root rounded fullWidth>
        <Card.Content>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(3.5),
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing(2.5),
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(2.5),
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: HEALTH_TOKENS.radius,
                    background: LEVEL_STYLES[level].soft,
                    color: LEVEL_STYLES[level].ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconHeartRateMonitor size={18} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{ fontWeight: HEALTH_TOKENS.fontWeightSemiBold }}
                  >
                    {t('Health')}
                  </span>
                  <span
                    style={{
                      fontSize: HEALTH_TOKENS.fontSizeSm,
                      color: HEALTH_TOKENS.textSecondary,
                    }}
                  >
                    {app?.monitor == null
                      ? t('Not monitored')
                      : t(
                          'Polled {time} · every {minutes} min · keeps {hours}h',
                          {
                            time: formatClock(app.monitor.lastPolledAt),
                            minutes: app.monitor.intervalMinutes,
                            hours: app.monitor.snapshotRetentionHours,
                          },
                        )}
                  </span>
                </span>
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(2),
                }}
              >
                {app?.monitor != null && (
                  <LevelTag
                    level={level}
                    label={app.monitor.isEnabled ? undefined : t('Disabled')}
                  />
                )}
                {canConfigure && app !== null && (
                  <Button
                    variant="outline"
                    color="neutral"
                    size="sm"
                    onClick={() => setIsConfigOpen(true)}
                  >
                    {app.monitor == null
                      ? t('Set up monitoring')
                      : t('Settings')}
                  </Button>
                )}
                {app?.monitor != null &&
                  overview.dashboardPageLayoutId !== null && (
                    <Button
                      variant="outline"
                      color="neutral"
                      size="sm"
                      onClick={() =>
                        void navigate(AppPath.PageLayoutPage, {
                          pageLayoutId: overview.dashboardPageLayoutId,
                        })
                      }
                    >
                      {t('Open dashboard')}
                    </Button>
                  )}
              </span>
            </div>

            {overview.error !== null && (
              <Banner color="danger">{overview.error}</Banner>
            )}

            {(overview.isLoading ||
              (app?.monitor?.isEnabled === true &&
                data === null &&
                dashboard.error === null)) && (
              <SkeletonPulse label={t('Loading health')}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing(3.5),
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: spacing(3),
                    }}
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: spacing(1.5),
                        }}
                      >
                        <SkeletonBar width="60%" height={9} />
                        <SkeletonBar width="40%" height={16} />
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(48, minmax(0, 1fr))',
                      gap: 2,
                    }}
                  >
                    {Array.from({ length: 48 }, (_, index) => (
                      <SkeletonBar key={index} width="100%" height={18} />
                    ))}
                  </div>
                </div>
              </SkeletonPulse>
            )}

            {data !== null && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: spacing(3),
                  }}
                >
                  <Metric
                    label={t('Uptime 24h')}
                    value={formatPercent(data.stats.uptimePercent, 2)}
                  />
                  <Metric
                    label={t('Healthy nodes')}
                    value={`${healthyNodes} / ${data.nodes.length}`}
                  />
                  <Metric
                    label={t('Processes online')}
                    value={`${processes.filter((process) => process.status === 'online').length} / ${processes.length}`}
                  />
                  <Metric
                    label={t('Open incidents')}
                    value={String(openIncidents.length)}
                    color={
                      openIncidents.length > 0
                        ? LEVEL_STYLES.WARNING.ink
                        : undefined
                    }
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing(1.5),
                  }}
                >
                  <span
                    style={{
                      fontSize: HEALTH_TOKENS.fontSizeSm,
                      color: HEALTH_TOKENS.textSecondary,
                    }}
                  >
                    {t('Last 24 hours, worst state across nodes')}
                  </span>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(48, minmax(0, 1fr))',
                      gap: 2,
                    }}
                  >
                    {cells.map((cellLevel, index) => (
                      <span
                        key={index}
                        title={t(LEVEL_STYLES[cellLevel].label)}
                        style={{
                          height: 18,
                          borderRadius: HEALTH_TOKENS.radiusSmall,
                          background: LEVEL_STYLES[cellLevel].fill,
                        }}
                      />
                    ))}
                  </div>
                </div>
                {openIncidents.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: spacing(2),
                    }}
                  >
                    {openIncidents.slice(0, 6).map((incident) => (
                      <Tag
                        key={incident.id}
                        color={LEVEL_STYLES[incident.severity].tagColor}
                        weight="medium"
                      >
                        {describeIncidentLabel(incident, data?.nodeLabels)}
                      </Tag>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card.Content>
      </Card.Root>

      {isConfigOpen && canConfigure && app !== null && (
        <ConfigLoader
          appId={app.appId}
          onClose={() => setIsConfigOpen(false)}
          onSaved={() => {
            setIsConfigOpen(false);
            void overview.reload().then(() => dashboard.reload());
          }}
        />
      )}
    </HealthThemeRoot>
  );
};

export default defineFrontComponent({
  universalIdentifier: APP_HEALTH_FRONT_COMPONENT_UID,
  name: 'app-health',
  description:
    'Health summary of a Task Manager app on its record page, with a link to the dashboard and, for admins, the monitor settings.',
  component: AppHealth,
});
