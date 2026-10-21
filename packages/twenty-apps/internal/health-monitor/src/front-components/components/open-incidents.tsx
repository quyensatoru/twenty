import { t } from 'twenty-sdk/front-component';
import { Button } from 'twenty-ui/primitives/input';

import { type HealthIncidentRecord } from '../../types/health-incident-record';
import { formatHealthValue } from '../../utils/format-health-value.util';
import { describeIncidentLabel } from '../utils/describe-incident-label.util';
import { formatClock, formatSince } from '../utils/format-health.util';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';

type OpenIncidentsProps = {
  incidents: HealthIncidentRecord[];
  nowMs: number;
  onAcknowledge: (incidentId: string) => void;
  acknowledgingId: string | null;
  nodeLabels?: Record<string, string>;
};

export const OpenIncidents = ({
  incidents,
  nowMs,
  onAcknowledge,
  acknowledgingId,
  nodeLabels = {},
}: OpenIncidentsProps) => {
  const active = incidents.filter(
    (incident) =>
      incident.status === 'OPEN' || incident.status === 'ACKNOWLEDGED',
  );

  if (active.length === 0) {
    return (
      <span style={{ color: HEALTH_TOKENS.textTertiary }}>
        {t('No open incident.')}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
      {active.map((incident) => (
        <div
          key={incident.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(1.5),
            padding: spacing(3),
            borderRadius: HEALTH_TOKENS.radius,
            background: LEVEL_STYLES[incident.severity].soft,
            border: `1px solid ${LEVEL_STYLES[incident.severity].fill}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: spacing(2),
            }}
          >
            <span style={{ fontWeight: HEALTH_TOKENS.fontWeightSemiBold }}>
              {describeIncidentLabel(incident, nodeLabels)}
            </span>
            <span
              style={{
                fontSize: HEALTH_TOKENS.fontSizeSm,
                color: LEVEL_STYLES[incident.severity].ink,
                whiteSpace: 'nowrap',
              }}
            >
              {formatSince(incident.openedAt, nowMs)}
            </span>
          </div>
          <span
            style={{
              fontSize: HEALTH_TOKENS.fontSizeSm,
              color: HEALTH_TOKENS.textSecondary,
            }}
          >
            {[
              t('Opened {time}', { time: formatClock(incident.openedAt) }),
              incident.lastValue === null
                ? null
                : t('now {value}', {
                    value: formatHealthValue(
                      incident.metric,
                      incident.lastValue,
                    ),
                  }),
              incident.peakValue === null
                ? null
                : t('peak {value}', {
                    value: formatHealthValue(
                      incident.metric,
                      incident.peakValue,
                    ),
                  }),
              t('{count} emails', { count: incident.notifyCount }),
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </span>
          {incident.status === 'ACKNOWLEDGED' ? (
            <span
              style={{
                fontSize: HEALTH_TOKENS.fontSizeSm,
                color: HEALTH_TOKENS.accent,
              }}
            >
              {t('Acknowledged at {time}, reminders stopped', {
                time: formatClock(incident.acknowledgedAt),
              })}
            </span>
          ) : (
            <div>
              <Button
                variant="outline"
                color="neutral"
                size="sm"
                loading={acknowledgingId === incident.id}
                disabled={acknowledgingId === incident.id}
                onClick={() => onAcknowledge(incident.id)}
              >
                {t('Acknowledge')}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
