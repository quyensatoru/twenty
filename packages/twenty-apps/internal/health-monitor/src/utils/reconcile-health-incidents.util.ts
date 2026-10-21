import { type HealthBreach } from '../types/health-breach';
import {
  type HealthIncidentDraft,
  type HealthIncidentPlan,
  type HealthNotificationKind,
} from '../types/health-incident-plan';
import { type HealthIncidentRecord } from '../types/health-incident-record';
import { type HealthMonitorPolicy } from '../types/health-monitor-record';
import {
  HEALTH_SEVERITY_RANK,
  type HealthSeverity,
} from '../types/health-severity';

type ReconcileInput = {
  activeIncidents: HealthIncidentRecord[];
  breaches: HealthBreach[];
  policy: Pick<HealthMonitorPolicy, 'openAfterBreaches' | 'renotifyMinutes'>;
  now: string;
  // When the endpoint did not answer there is no evidence either way about the
  // nodes, so only the endpoint incident itself may resolve.
  canResolve: (incident: HealthIncidentRecord) => boolean;
};

const maxSeverity = (
  left: HealthSeverity,
  right: HealthSeverity,
): HealthSeverity =>
  HEALTH_SEVERITY_RANK[left] >= HEALTH_SEVERITY_RANK[right] ? left : right;

const maxValue = (left: number | null, right: number | null): number | null => {
  if (left === null) return right;
  if (right === null) return left;

  return Math.max(left, right);
};

const isReminderDue = (
  lastNotifiedAt: string | null,
  renotifyMinutes: number,
  now: string,
): boolean =>
  lastNotifiedAt === null ||
  Date.parse(now) - Date.parse(lastNotifiedAt) >= renotifyMinutes * 60_000;

const draftFromBreach = (
  breach: HealthBreach,
  now: string,
): HealthIncidentDraft => ({
  id: null,
  title: breach.title,
  dedupeKey: breach.dedupeKey,
  nodeKey: breach.nodeKey,
  host: breach.host,
  serviceName: breach.serviceName,
  metric: breach.metric,
  severity: breach.severity,
  peakSeverity: breach.severity,
  status: 'PENDING',
  breachCount: 1,
  lastValue: breach.value,
  peakValue: breach.value,
  threshold: breach.threshold,
  firstBreachAt: now,
  openedAt: null,
  resolvedAt: null,
  lastNotifiedAt: null,
  notifyCount: 0,
  acknowledgedByMemberId: null,
  acknowledgedAt: null,
});

const planNewBreach = (
  breach: HealthBreach,
  openAfterBreaches: number,
  now: string,
): HealthIncidentPlan => {
  const draft = draftFromBreach(breach, now);

  if (breach.isEvent) {
    return {
      action: 'create',
      incident: {
        ...draft,
        status: 'RESOLVED',
        openedAt: now,
        resolvedAt: now,
      },
      notification: 'EVENT',
    };
  }

  if (breach.opensImmediately || openAfterBreaches <= 1) {
    return {
      action: 'create',
      incident: { ...draft, status: 'OPEN', openedAt: now },
      notification: 'OPENED',
    };
  }

  return { action: 'create', incident: draft, notification: null };
};

const planExistingBreach = (
  incident: HealthIncidentRecord,
  breach: HealthBreach,
  policy: ReconcileInput['policy'],
  now: string,
): HealthIncidentPlan => {
  const isEscalation =
    HEALTH_SEVERITY_RANK[breach.severity] >
    HEALTH_SEVERITY_RANK[incident.severity];
  const next: HealthIncidentDraft = {
    ...incident,
    title: breach.title,
    host: breach.host ?? incident.host,
    severity: breach.severity,
    peakSeverity: maxSeverity(incident.peakSeverity, breach.severity),
    breachCount: incident.breachCount + 1,
    lastValue: breach.value,
    peakValue: maxValue(incident.peakValue, breach.value),
    threshold: breach.threshold,
  };

  if (incident.status === 'PENDING') {
    const opens =
      breach.opensImmediately || next.breachCount >= policy.openAfterBreaches;

    return opens
      ? {
          action: 'update',
          incident: { ...next, status: 'OPEN', openedAt: now },
          notification: 'OPENED',
        }
      : { action: 'update', incident: next, notification: null };
  }

  let notification: HealthNotificationKind | null = null;

  if (isEscalation) {
    notification = 'ESCALATED';
  } else if (
    incident.status === 'OPEN' &&
    isReminderDue(incident.lastNotifiedAt, policy.renotifyMinutes, now)
  ) {
    notification = incident.notifyCount === 0 ? 'OPENED' : 'REMINDER';
  }

  return { action: 'update', incident: next, notification };
};

export const reconcileHealthIncidents = ({
  activeIncidents,
  breaches,
  policy,
  now,
  canResolve,
}: ReconcileInput): HealthIncidentPlan[] => {
  const plans: HealthIncidentPlan[] = [];
  const activeByKey = new Map(
    activeIncidents.map((incident) => [incident.dedupeKey, incident]),
  );
  const breachedKeys = new Set<string>();

  for (const breach of breaches) {
    if (breachedKeys.has(breach.dedupeKey)) {
      continue;
    }

    breachedKeys.add(breach.dedupeKey);

    const existing = activeByKey.get(breach.dedupeKey);

    plans.push(
      existing === undefined
        ? planNewBreach(breach, policy.openAfterBreaches, now)
        : planExistingBreach(existing, breach, policy, now),
    );
  }

  for (const incident of activeIncidents) {
    if (breachedKeys.has(incident.dedupeKey) || !canResolve(incident)) {
      continue;
    }

    if (incident.status === 'PENDING') {
      plans.push({ action: 'delete', incidentId: incident.id });
      continue;
    }

    plans.push({
      action: 'update',
      incident: { ...incident, status: 'RESOLVED', resolvedAt: now },
      notification: incident.notifyCount > 0 ? 'RESOLVED' : null,
    });
  }

  return plans;
};
