import { type HealthNotificationKind } from '../types/health-incident-plan';
import { type HealthNotification } from '../types/health-notification';
import { describeIncident } from './describe-incident.util';
import { escapeHtml } from './escape-html.util';
import { formatHealthValue } from './format-health-value.util';
import { type NodeLabels } from './format-node-label.util';
import { interpolate, type Translate } from './translate.util';

export type AlertEmail = { subject: string; html: string; text: string };

const KIND_LABELS: Record<HealthNotificationKind, string> = {
  OPENED: 'New incident',
  ESCALATED: 'Escalated to critical',
  EVENT: 'Event',
  REMINDER: 'Still open',
  RESOLVED: 'Recovered',
};

const KIND_ORDER: HealthNotificationKind[] = [
  'ESCALATED',
  'OPENED',
  'EVENT',
  'REMINDER',
  'RESOLVED',
];

const ALERTING_KINDS: HealthNotificationKind[] = [
  'OPENED',
  'ESCALATED',
  'EVENT',
];

const formatTime = (iso: string | null): string => {
  if (iso === null) {
    return '';
  }

  const local = new Date(Date.parse(iso) + 7 * 3_600_000);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())} ${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}`;
};

export const buildAlertEmail = ({
  appName,
  notifications,
  dashboardUrl,
  t = interpolate,
  nodeLabels = {},
}: {
  appName: string;
  notifications: HealthNotification[];
  dashboardUrl: string | null;
  t?: Translate;
  nodeLabels?: NodeLabels;
}): AlertEmail => {
  const sorted = [...notifications].sort(
    (left, right) =>
      KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind),
  );
  const titleOf = ({ incident }: HealthNotification) =>
    describeIncident(
      {
        metric: incident.metric,
        nodeKey: incident.nodeKey,
        serviceName: incident.serviceName,
        threshold: incident.threshold,
        value: incident.lastValue,
      },
      t,
      nodeLabels,
    );
  const severityOf = (notification: HealthNotification) =>
    (notification.kind === 'RESOLVED'
      ? notification.incident.peakSeverity
      : notification.incident.severity) === 'CRITICAL'
      ? t('Critical')
      : t('Warning');
  const describeValue = ({ incident }: HealthNotification): string => {
    const value = formatHealthValue(incident.metric, incident.lastValue);
    const threshold = formatHealthValue(incident.metric, incident.threshold);

    if (
      value === '' ||
      threshold === '' ||
      incident.metric === 'SERVICE_RESTARTS' ||
      incident.metric === 'ENDPOINT_UNREACHABLE'
    ) {
      return value;
    }

    return t('{value} (threshold {threshold})', { value, threshold });
  };

  const alerting = sorted.filter((notification) =>
    ALERTING_KINDS.includes(notification.kind),
  );
  const reminders = sorted.filter(
    (notification) => notification.kind === 'REMINDER',
  );
  const more = (count: number) =>
    count > 1 ? ` ${t('and {count} more', { count: count - 1 })}` : '';
  let headline: string;
  let accent: { background: string; ink: string; label: string };

  if (alerting.length > 0) {
    const critical = alerting.filter(
      (notification) => notification.incident.severity === 'CRITICAL',
    );

    headline = `${titleOf(critical[0] ?? alerting[0])}${more(alerting.length)}`;
    accent =
      critical.length > 0
        ? {
            background: '#FBE3E2',
            ink: '#B3261E',
            label: t('Critical').toUpperCase(),
          }
        : {
            background: '#FDF0D8',
            ink: '#A35F00',
            label: t('Warning').toUpperCase(),
          };
  } else if (reminders.length > 0) {
    headline = t('{count} incidents still open', { count: reminders.length });
    accent = {
      background: '#FDF0D8',
      ink: '#A35F00',
      label: t('Reminder').toUpperCase(),
    };
  } else {
    headline = `${titleOf(sorted[0])}${more(sorted.length)}`;
    accent = {
      background: '#E2F1E7',
      ink: '#2E7148',
      label: t('Recovered').toUpperCase(),
    };
  }

  const subject = `[${appName}] ${accent.label}: ${headline}`;

  const rows = sorted
    .map(
      (notification) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #F1F1F1;vertical-align:top"><div style="font-weight:600">${escapeHtml(titleOf(notification))}</div><div style="color:#767676;font-size:12px">${escapeHtml(notification.incident.host ?? '')}</div></td>
<td style="padding:8px 8px;border-bottom:1px solid #F1F1F1;vertical-align:top;white-space:nowrap">${escapeHtml(t(KIND_LABELS[notification.kind]))}<div style="color:#767676;font-size:12px">${escapeHtml(severityOf(notification))}</div></td>
<td style="padding:8px 0;border-bottom:1px solid #F1F1F1;vertical-align:top;text-align:right">${escapeHtml(describeValue(notification))}<div style="color:#767676;font-size:12px">${escapeHtml(t('since {time}', { time: formatTime(notification.incident.openedAt ?? notification.incident.firstBreachAt) }))}</div></td>
</tr>`,
    )
    .join('');

  const link =
    dashboardUrl === null
      ? ''
      : `<p style="margin:20px 0 0"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:8px 14px;border-radius:4px;background:#333333;color:#FFFFFF;text-decoration:none;font-weight:500">${escapeHtml(t('Open Health Monitor'))}</a></p>`;

  const html = `<div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#333333;max-width:640px">
<div style="background:${accent.background};padding:16px 20px;border-radius:8px 8px 0 0">
<div style="font-size:12px;font-weight:600;letter-spacing:0.04em;color:${accent.ink}">${escapeHtml(accent.label)} · ${escapeHtml(appName)}</div>
<div style="font-size:16px;font-weight:600;margin-top:4px">${escapeHtml(headline)}</div>
</div>
<div style="border:1px solid #EBEBEB;border-top:0;border-radius:0 0 8px 8px;padding:16px 20px">
<table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>
${link}
<p style="margin:16px 0 0;font-size:12px;color:#767676">${escapeHtml(t('You get this email because you are on the health alert list of {app}.', { app: appName }))}</p>
</div>
</div>`;

  const text = [
    subject,
    '',
    ...sorted.map(
      (notification) =>
        `- [${t(KIND_LABELS[notification.kind])} · ${severityOf(notification)}] ${titleOf(notification)}${describeValue(notification) === '' ? '' : `: ${describeValue(notification)}`}`,
    ),
    ...(dashboardUrl === null
      ? []
      : ['', `${t('Open Health Monitor')}: ${dashboardUrl}`]),
  ].join('\n');

  return { subject, html, text };
};
