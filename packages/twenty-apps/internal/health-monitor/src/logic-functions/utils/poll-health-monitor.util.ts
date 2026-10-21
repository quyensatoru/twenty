import { type ApiClient } from '../../types/api-client';
import { type HealthBreach } from '../../types/health-breach';
import {
  type HealthIncidentDraft,
  type HealthIncidentPlan,
} from '../../types/health-incident-plan';
import { type HealthMonitorRecord } from '../../types/health-monitor-record';
import { type HealthNotification } from '../../types/health-notification';
import { type HealthNodeSnapshot } from '../../types/health-snapshot-metrics';
import { type HealthSnapshotStatus } from '../../types/health-snapshot-status';
import { buildAlertEmail } from '../../utils/build-alert-email.util';
import { describeIncident } from '../../utils/describe-incident.util';
import { evaluateHealthRules } from '../../utils/evaluate-health-rules.util';
import { flattenHealthPayload } from '../../utils/flatten-health-payload.util';
import { gradeSnapshotStatus } from '../../utils/grade-snapshot-status.util';
import { isOffHours } from '../../utils/is-off-hours.util';
import { mergeMissingNodes } from '../../utils/merge-missing-nodes.util';
import { reconcileHealthIncidents } from '../../utils/reconcile-health-incidents.util';
import { selectAlertRecipients } from '../../utils/select-alert-recipients.util';
import { fetchHealthPayload } from './fetch-health-payload.util';
import {
  ACTIVE_INCIDENT_STATUSES,
  createHealthIncidents,
  destroyHealthIncidents,
  listHealthIncidents,
  updateHealthIncident,
} from './health-incident-store.util';
import { updateHealthMonitor } from './health-monitor-store.util';
import { readErrorMessage } from './read-error-message.util';
import { readEmailTranslate } from './read-email-translate.util';
import { sendAlertEmail } from './send-alert-email.util';

export type PollContext = {
  client: ApiClient;
  now: string;
  appName: string;
  dashboardUrl: string | null;
  loadMemberEmails: () => Promise<Map<string, string>>;
};

export type PollSummary = {
  monitorId: string;
  status: HealthSnapshotStatus;
  latencyMs: number | null;
  nodeCount: number;
  breachCount: number;
  emailsSent: number;
  emailErrors: string[];
};

const LEASE_EXTRA_MS = 50_000;

const unreachableBreach = (
  monitor: HealthMonitorRecord,
  failures: number,
): HealthBreach => ({
  dedupeKey: 'endpoint:ENDPOINT_UNREACHABLE',
  title: describeIncident({
    metric: 'ENDPOINT_UNREACHABLE',
    nodeKey: null,
    serviceName: null,
    threshold: null,
    value: failures,
  }),
  nodeKey: null,
  host: monitor.endpointUrl,
  serviceName: null,
  metric: 'ENDPOINT_UNREACHABLE',
  severity: 'CRITICAL',
  value: failures,
  threshold: monitor.unreachableAfterFailures,
  opensImmediately: true,
  isEvent: false,
});

const toNotifications = (plans: HealthIncidentPlan[]): HealthNotification[] =>
  plans.flatMap((plan) =>
    plan.action !== 'delete' && plan.notification !== null
      ? [{ kind: plan.notification, incident: plan.incident }]
      : [],
  );

const deliverNotifications = async ({
  monitor,
  notifications,
  context,
}: {
  monitor: HealthMonitorRecord;
  notifications: HealthNotification[];
  context: PollContext;
}): Promise<{
  delivered: Set<HealthIncidentDraft>;
  emailsSent: number;
  emailErrors: string[];
}> => {
  const delivered = new Set<HealthIncidentDraft>();
  const emailErrors: string[] = [];
  let emailsSent = 0;

  if (notifications.length === 0) {
    return { delivered, emailsSent, emailErrors };
  }

  const byEmail = selectAlertRecipients({
    notifications,
    recipients: monitor.recipients,
    emailByMemberId:
      monitor.recipients.length > 0
        ? await context.loadMemberEmails()
        : new Map(),
    extraEmails: monitor.extraEmails,
    criticalOnly: monitor.criticalOnlyOffHours && isOffHours(context.now),
  });

  for (const [email, emailNotifications] of byEmail) {
    const result = await sendAlertEmail(
      email,
      buildAlertEmail({
        appName: context.appName,
        notifications: emailNotifications,
        dashboardUrl: context.dashboardUrl,
        t: readEmailTranslate(),
        nodeLabels: monitor.nodeLabels,
      }),
    );

    if (result.ok) {
      emailsSent += 1;
      emailNotifications.forEach((notification) =>
        delivered.add(notification.incident),
      );
    } else {
      emailErrors.push(`${email}: ${result.error}`);
    }
  }

  return { delivered, emailsSent, emailErrors };
};

const writePlans = async ({
  client,
  monitorId,
  plans,
  delivered,
  now,
}: {
  client: ApiClient;
  monitorId: string;
  plans: HealthIncidentPlan[];
  delivered: Set<HealthIncidentDraft>;
  now: string;
}) => {
  const markDelivered = (incident: HealthIncidentDraft): HealthIncidentDraft =>
    delivered.has(incident)
      ? {
          ...incident,
          lastNotifiedAt: now,
          notifyCount: incident.notifyCount + 1,
        }
      : incident;

  await createHealthIncidents({
    client,
    monitorId,
    incidents: plans.flatMap((plan) =>
      plan.action === 'create' ? [markDelivered(plan.incident)] : [],
    ),
  });

  for (const plan of plans) {
    if (plan.action === 'update' && plan.incident.id !== null) {
      await updateHealthIncident({
        client,
        incident: { ...markDelivered(plan.incident), id: plan.incident.id },
      });
    }
  }

  await destroyHealthIncidents({
    client,
    ids: plans.flatMap((plan) =>
      plan.action === 'delete' ? [plan.incidentId] : [],
    ),
  });
};

export const pollHealthMonitor = async (
  monitor: HealthMonitorRecord,
  context: PollContext,
): Promise<PollSummary> => {
  const { client, now } = context;

  await updateHealthMonitor({
    client,
    monitorId: monitor.id,
    data: {
      pollLeaseUntil: new Date(
        Date.parse(now) + monitor.timeoutSeconds * 1000 + LEASE_EXTRA_MS,
      ).toISOString(),
    },
  });

  const result = await fetchHealthPayload(monitor);
  const previousNodes = monitor.lastSnapshot?.nodes ?? null;
  let nodes: HealthNodeSnapshot[] = previousNodes ?? [];
  let breaches: HealthBreach[] = [];
  let status: HealthSnapshotStatus;
  let failures = 0;
  let lastError: string | null = null;

  if (result.ok) {
    const payloadNodes = flattenHealthPayload(result.payload);

    nodes = mergeMissingNodes(payloadNodes, previousNodes);
    breaches = evaluateHealthRules({
      nodes,
      previousNodes,
      rules: monitor.rules,
      mutedNodeKeys: monitor.mutedNodeKeys,
    });
    status = gradeSnapshotStatus(breaches);
    lastError =
      payloadNodes.length === 0
        ? 'The payload has no node. Check the header secret.'
        : null;
  } else {
    failures = monitor.consecutiveFailures + 1;
    status = 'UNREACHABLE';
    lastError = result.error;

    if (failures >= monitor.unreachableAfterFailures) {
      breaches = [unreachableBreach(monitor, failures)];
    }
  }

  let emailsSent = 0;
  let emailErrors: string[] = [];

  try {
    const plans = reconcileHealthIncidents({
      activeIncidents: await listHealthIncidents({
        client,
        filter: {
          monitorId: { eq: monitor.id },
          status: { in: ACTIVE_INCIDENT_STATUSES },
        },
      }),
      breaches,
      policy: monitor,
      now,
      canResolve: () => result.ok,
    });
    const delivery = await deliverNotifications({
      monitor,
      notifications: toNotifications(plans).filter(
        (notification) =>
          monitor.sendRecovery || notification.kind !== 'RESOLVED',
      ),
      context,
    });

    emailsSent = delivery.emailsSent;
    emailErrors = delivery.emailErrors;
    await writePlans({
      client,
      monitorId: monitor.id,
      plans,
      delivered: delivery.delivered,
      now,
    });
  } catch (error) {
    lastError = `Incident update failed: ${readErrorMessage(error)}`;
  }

  await client.mutation({
    createHealthSnapshot: {
      __args: {
        data: {
          monitorId: monitor.id,
          name: now,
          polledAt: now,
          status,
          latencyMs: result.latencyMs,
          httpStatus: result.httpStatus,
          error: result.ok ? null : result.error,
          metrics: result.ok ? { version: 1, nodes } : null,
        },
      },
      id: true,
    },
  });

  await updateHealthMonitor({
    client,
    monitorId: monitor.id,
    data: {
      lastPolledAt: now,
      pollLeaseUntil: null,
      lastStatus: status,
      lastLatencyMs: result.latencyMs,
      lastError:
        emailErrors.length > 0
          ? `Email failed: ${emailErrors.join('; ')}`.slice(0, 1000)
          : lastError,
      consecutiveFailures: failures,
      ...(result.ok ? { lastSnapshot: { version: 1, nodes } } : {}),
    },
  });

  return {
    monitorId: monitor.id,
    status,
    latencyMs: result.latencyMs,
    nodeCount: nodes.length,
    breachCount: breaches.length,
    emailsSent,
    emailErrors,
  };
};
