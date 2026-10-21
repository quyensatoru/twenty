import { t } from 'twenty-sdk/front-component';
import { Tag } from 'twenty-ui/primitives/data-display';

import { type HealthIncidentRecord } from '../../types/health-incident-record';
import { useIsMobile } from '../hooks/use-is-mobile';
import { describeIncidentLabel } from '../utils/describe-incident-label.util';
import { formatClock, formatDateTime } from '../utils/format-health.util';
import { HEALTH_TOKENS, LEVEL_STYLES, spacing } from './health-tokens';

type IncidentTimelineProps = {
  incidents: HealthIncidentRecord[];
  startAt: string;
  endAt: string;
  nodeLabels?: Record<string, string>;
};

const STATUS_TAGS: Record<
  HealthIncidentRecord['status'],
  { label: string; color: 'gray' | 'orange' | 'blue' | 'green' }
> = {
  PENDING: { label: 'Pending', color: 'gray' },
  OPEN: { label: 'Open', color: 'orange' },
  ACKNOWLEDGED: { label: 'Acknowledged', color: 'blue' },
  RESOLVED: { label: 'Recovered', color: 'green' },
};

export const IncidentTimeline = ({
  incidents,
  startAt,
  endAt,
  nodeLabels = {},
}: IncidentTimelineProps) => {
  const isMobile = useIsMobile();
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  const spanMs = endMs - startMs;
  const position = (iso: string | null, fallbackMs: number) =>
    Math.max(
      0,
      Math.min(
        100,
        (((iso === null ? fallbackMs : Date.parse(iso)) - startMs) / spanMs) *
          100,
      ),
    );
  const format = spanMs > 26 * 3_600_000 ? formatDateTime : formatClock;

  if (incidents.length === 0) {
    return (
      <span style={{ color: HEALTH_TOKENS.textTertiary }}>
        {t('No incident in this range.')}
      </span>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          minWidth: isMobile ? 0 : 720,
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? spacing(3) : spacing(2),
        }}
      >
        {incidents.slice(0, 30).map((incident) => {
          const from = position(
            incident.openedAt ?? incident.firstBreachAt,
            startMs,
          );
          const to = position(incident.resolvedAt, endMs);
          const isEvent = incident.metric === 'SERVICE_RESTARTS';
          const label = describeIncidentLabel(incident, nodeLabels);
          const status = isEvent
            ? { label: 'Event', color: 'blue' as const }
            : STATUS_TAGS[incident.status];

          return (
            <div
              key={incident.id}
              style={{
                display: 'flex',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                alignItems: 'center',
                gap: isMobile ? spacing(1.5) : spacing(3),
              }}
            >
              <span
                style={{
                  width: isMobile ? '100%' : 280,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <span
                  title={label}
                  style={{
                    fontWeight: HEALTH_TOKENS.fontWeightMedium,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: HEALTH_TOKENS.fontSizeSm,
                    color: HEALTH_TOKENS.textTertiary,
                  }}
                >
                  {formatDateTime(incident.openedAt ?? incident.firstBreachAt)}
                  {incident.resolvedAt !== null && !isEvent
                    ? ` → ${formatDateTime(incident.resolvedAt)}`
                    : ''}{' '}
                  · {t('{count} emails', { count: incident.notifyCount })}
                </span>
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: isMobile ? 0 : undefined,
                  position: 'relative',
                  height: 22,
                  background: HEALTH_TOKENS.backgroundTertiary,
                  borderRadius: HEALTH_TOKENS.radiusSmall,
                }}
              >
                {isEvent ? (
                  <span
                    title={`${format(incident.openedAt ?? '')} · ${label}`}
                    style={{
                      position: 'absolute',
                      top: 5,
                      left: `${from}%`,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      transform: 'translateX(-50%)',
                      background: HEALTH_TOKENS.accent,
                      boxShadow: `0 0 0 2px ${HEALTH_TOKENS.background}`,
                    }}
                  />
                ) : (
                  <span
                    title={label}
                    style={{
                      position: 'absolute',
                      top: 3,
                      height: 16,
                      borderRadius: HEALTH_TOKENS.radiusSmall,
                      minWidth: 6,
                      left: `${from}%`,
                      width: `${Math.max(0.5, to - from)}%`,
                      background: LEVEL_STYLES[incident.peakSeverity].fill,
                    }}
                  />
                )}
              </span>
              <span
                style={{
                  width: isMobile ? 'auto' : 120,
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Tag color={status.color} weight="medium" preventShrink>
                  {t(status.label)}
                </Tag>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
