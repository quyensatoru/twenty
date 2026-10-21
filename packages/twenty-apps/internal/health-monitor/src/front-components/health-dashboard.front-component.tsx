import { useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, t } from 'twenty-sdk/front-component';
import {
  IconHeartRateMonitor,
  IconRefresh,
  IconSettings,
} from 'twenty-ui/icon';
import { Banner } from 'twenty-ui/primitives/feedback';
import { Button, SegmentedControl } from 'twenty-ui/primitives/input';
import { Tabs } from 'twenty-ui/primitives/navigation';
import { Card } from 'twenty-ui/primitives/surfaces';

import { RETENTION_HOUR_OPTIONS } from '../constants/health-options';
import {
  ACKNOWLEDGE_HEALTH_INCIDENT_ROUTE_PATH,
  CHECK_HEALTH_NOW_ROUTE_PATH,
} from '../constants/route-paths';
import { HEALTH_DASHBOARD_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { type HealthLevel } from '../types/health-dashboard';
import { type HealthAppOverview } from '../types/health-route-results';
import { ConfigLoader } from './components/config-loader';
import {
  DashboardSkeleton,
  HeaderTabsSkeleton,
} from './components/dashboard-skeleton';
import { DashboardView } from './components/dashboard-view';
import { HealthThemeRoot } from './components/health-theme-root';
import {
  HEALTH_TOKENS,
  LEVEL_STYLES,
  spacing,
} from './components/health-tokens';
import { NodeDetailView } from './components/node-detail-view';
import { useHealthDashboard } from './hooks/use-health-dashboard';
import { useHealthOverview } from './hooks/use-health-overview';
import { useIsMobile } from './hooks/use-is-mobile';
import {
  formatClockWithSeconds,
  formatRangeLabel,
} from './utils/format-health.util';
import { postAppRoute, readErrorText } from './utils/post-app-route.util';

const RANGE_OPTIONS = [1, ...RETENTION_HOUR_OPTIONS];

const appLevel = (app: HealthAppOverview): HealthLevel => {
  if (app.monitor === null || !app.monitor.isEnabled) return 'NONE';
  if (
    app.monitor.lastStatus === 'UNREACHABLE' ||
    app.monitor.criticalIncidentCount > 0
  )
    return 'CRITICAL';
  if (app.monitor.openIncidentCount > 0 || app.monitor.lastStatus === 'WARNING')
    return 'WARNING';

  return app.monitor.lastStatus === null ? 'NONE' : 'OK';
};

const LevelDot = ({ level }: { level: HealthLevel }) => (
  <span
    aria-hidden="true"
    style={{
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: LEVEL_STYLES[level].line,
      display: 'inline-block',
    }}
  />
);

const HealthDashboard = () => {
  const overview = useHealthOverview();
  const isMobile = useIsMobile();
  const [chosenAppId, setChosenAppId] = useState<string | null>(null);
  const [rangeHours, setRangeHours] = useState(24);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const defaultApp =
    overview.apps.find((app) => app.monitor?.isEnabled === true) ??
    overview.apps[0] ??
    null;
  const app =
    overview.apps.find((candidate) => candidate.appId === chosenAppId) ??
    defaultApp;
  const canConfigure = app?.canConfigure === true;
  const retentionHours = app?.monitor?.snapshotRetentionHours ?? 24;
  const effectiveRange = Math.min(rangeHours, retentionHours);
  const dashboard = useHealthDashboard(
    app?.monitor?.id ?? null,
    effectiveRange,
  );
  const nowMs = Date.now();
  const selectedNode =
    dashboard.data?.dashboard.nodes.find(
      (node) => node.key === selectedNodeKey,
    ) ?? null;

  const checkNow = async () => {
    if (app?.monitor == null) return;

    setIsChecking(true);

    try {
      await postAppRoute(CHECK_HEALTH_NOW_ROUTE_PATH, {
        monitorId: app.monitor.id,
      });
      await Promise.all([overview.reload(), dashboard.reload()]);
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const acknowledge = async (incidentId: string) => {
    setAcknowledgingId(incidentId);

    try {
      await postAppRoute(ACKNOWLEDGE_HEALTH_INCIDENT_ROUTE_PATH, {
        incidentId,
      });
      await dashboard.reload();
      void enqueueSnackbar({
        message: t('Acknowledged. No more reminders for this incident.'),
        variant: 'success',
      });
    } catch (error) {
      void enqueueSnackbar({ message: readErrorText(error), variant: 'error' });
    } finally {
      setAcknowledgingId(null);
    }
  };

  return (
    <HealthThemeRoot>
      <div
        style={{
          minHeight: '100%',
          boxSizing: 'border-box',
          background: HEALTH_TOKENS.backgroundSecondary,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing(3),
            padding: `0 ${isMobile ? spacing(3) : spacing(5)}`,
            borderBottom: `1px solid ${HEALTH_TOKENS.border}`,
            background: HEALTH_TOKENS.background,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: spacing(3),
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            {overview.isLoading && <HeaderTabsSkeleton />}
            {overview.apps.length > 0 && (
              <Tabs.Root
                value={app?.appId ?? null}
                onValueChange={(value) => {
                  setChosenAppId(typeof value === 'string' ? value : null);
                  setSelectedNodeKey(null);
                }}
              >
                <Tabs.List style={{ overflowX: 'auto', maxWidth: '100%' }}>
                  {overview.apps.map((candidate) => (
                    <Tabs.Tab
                      key={candidate.appId}
                      value={candidate.appId}
                      startIcon={<LevelDot level={appLevel(candidate)} />}
                    >
                      {candidate.appName}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs.Root>
            )}
            {app?.monitor?.isEnabled === true && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(1.5),
                  color: HEALTH_TOKENS.textSecondary,
                  fontSize: HEALTH_TOKENS.fontSizeSm,
                }}
              >
                <LevelDot level="OK" />
                {t('Live · polled {time} · every {minutes} min', {
                  time: formatClockWithSeconds(app.monitor.lastPolledAt),
                  minutes: app.monitor.intervalMinutes,
                })}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: spacing(2),
              padding: `${spacing(2)} 0`,
              width: isMobile ? '100%' : undefined,
            }}
          >
            {app?.monitor != null && (
              <SegmentedControl
                aria-label={t('Time range')}
                value={String(effectiveRange)}
                onValueChange={(value) => setRangeHours(Number(value))}
                options={RANGE_OPTIONS.map((hours) => ({
                  value: String(hours),
                  label: formatRangeLabel(hours),
                  disabled: hours > retentionHours,
                }))}
              />
            )}
            {canConfigure && app !== null && (
              <Button
                variant="outline"
                color="neutral"
                size="sm"
                startIcon={<IconSettings size={16} />}
                onClick={() => setIsConfigOpen(true)}
              >
                {t('Settings')}
              </Button>
            )}
            {app?.monitor != null && (
              <Button
                variant="solid"
                color="accent"
                size="sm"
                loading={isChecking}
                disabled={isChecking}
                startIcon={<IconRefresh size={16} />}
                onClick={() => void checkNow()}
              >
                {t('Check now')}
              </Button>
            )}
          </div>
        </header>

        <main
          style={{
            padding: isMobile ? spacing(3) : spacing(5),
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(4),
          }}
        >
          {overview.isLoading && <DashboardSkeleton />}
          {overview.error !== null && (
            <Banner color="danger">{overview.error}</Banner>
          )}
          {!overview.isLoading &&
            overview.apps.length === 0 &&
            overview.error === null && (
              <span style={{ color: HEALTH_TOKENS.textSecondary }}>
                {t('You have App access on no Task Manager app.')}
              </span>
            )}
          {app !== null && app.monitor === null && (
            <Card.Root rounded fullWidth>
              <Card.Content>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: spacing(3),
                    padding: spacing(10),
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <IconHeartRateMonitor
                    size={28}
                    color={HEALTH_TOKENS.textTertiary}
                  />
                  <span
                    style={{
                      fontWeight: HEALTH_TOKENS.fontWeightSemiBold,
                      fontSize: HEALTH_TOKENS.fontSizeLg,
                    }}
                  >
                    {t('{app} is not monitored yet', { app: app.appName })}
                  </span>
                  <span
                    style={{
                      color: HEALTH_TOKENS.textSecondary,
                      maxWidth: 440,
                    }}
                  >
                    {canConfigure
                      ? t(
                          'Set the health endpoint, its header secret and who gets alerts. A background job then polls it and keeps history for the charts.',
                        )
                      : t(
                          'Ask a workspace admin to set up monitoring for this app.',
                        )}
                  </span>
                  {canConfigure && (
                    <Button
                      variant="solid"
                      color="accent"
                      size="md"
                      onClick={() => setIsConfigOpen(true)}
                    >
                      {t('Set up monitoring')}
                    </Button>
                  )}
                </div>
              </Card.Content>
            </Card.Root>
          )}
          {app?.monitor != null && dashboard.error !== null && (
            <Banner color="danger">{dashboard.error}</Banner>
          )}
          {app?.monitor != null &&
            dashboard.data === null &&
            dashboard.error === null && <DashboardSkeleton />}
          {app?.monitor != null && dashboard.data !== null && (
            <div
              style={{
                opacity: dashboard.isLoading ? 0.6 : 1,
                transition: 'opacity 150ms ease-in-out',
              }}
            >
              {selectedNode !== null ? (
                <NodeDetailView
                  key={`node-${selectedNode.key}`}
                  node={selectedNode}
                  dashboard={dashboard.data.dashboard}
                  nowMs={nowMs}
                  onBack={() => setSelectedNodeKey(null)}
                  onAcknowledge={(incidentId) => void acknowledge(incidentId)}
                  acknowledgingId={acknowledgingId}
                />
              ) : (
                <DashboardView
                  key="overview"
                  app={dashboard.data.app}
                  dashboard={dashboard.data.dashboard}
                  nowMs={nowMs}
                  onSelectNode={setSelectedNodeKey}
                  onAcknowledge={(incidentId) => void acknowledge(incidentId)}
                  acknowledgingId={acknowledgingId}
                />
              )}
            </div>
          )}
        </main>

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
      </div>
    </HealthThemeRoot>
  );
};

export default defineFrontComponent({
  universalIdentifier: HEALTH_DASHBOARD_FRONT_COMPONENT_UID,
  name: 'health-dashboard',
  description:
    'Health Monitor dashboard: status strips, charts, processes and incidents per app, with the monitor settings for admins.',
  component: HealthDashboard,
});
