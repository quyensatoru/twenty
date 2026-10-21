import { describe, expect, it } from 'vitest';

import { type HealthBreach } from '../../types/health-breach';
import { type HealthIncidentRecord } from '../../types/health-incident-record';
import { reconcileHealthIncidents } from '../reconcile-health-incidents.util';

const NOW = '2026-10-21T01:30:00.000Z';
const POLICY = { openAfterBreaches: 2, renotifyMinutes: 60 };

const breach = (overrides: Partial<HealthBreach> = {}): HealthBreach => ({
  dedupeKey: 'hm.shard1:NODE_CPU',
  title: 'Heatmap · Shard 1: Node CPU ≥ 80%',
  nodeKey: 'hm.shard1',
  host: '10.0.2.1',
  serviceName: null,
  metric: 'NODE_CPU',
  severity: 'WARNING',
  value: 82.9,
  threshold: 80,
  opensImmediately: false,
  isEvent: false,
  ...overrides,
});

const incident = (
  overrides: Partial<HealthIncidentRecord> = {},
): HealthIncidentRecord => ({
  id: 'incident-1',
  monitorId: 'monitor-1',
  title: 'Heatmap · Shard 1: Node CPU ≥ 80%',
  dedupeKey: 'hm.shard1:NODE_CPU',
  nodeKey: 'hm.shard1',
  host: '10.0.2.1',
  serviceName: null,
  metric: 'NODE_CPU',
  severity: 'WARNING',
  peakSeverity: 'WARNING',
  status: 'OPEN',
  breachCount: 2,
  lastValue: 82,
  peakValue: 84.1,
  threshold: 80,
  firstBreachAt: '2026-10-21T01:20:00.000Z',
  openedAt: '2026-10-21T01:21:00.000Z',
  resolvedAt: null,
  lastNotifiedAt: '2026-10-21T01:21:00.000Z',
  notifyCount: 1,
  acknowledgedByMemberId: null,
  acknowledgedAt: null,
  ...overrides,
});

const reconcile = (
  activeIncidents: HealthIncidentRecord[],
  breaches: HealthBreach[],
) =>
  reconcileHealthIncidents({
    activeIncidents,
    breaches,
    policy: POLICY,
    now: NOW,
    canResolve: () => true,
  });

describe('reconcileHealthIncidents', () => {
  it('holds a first breach as pending without notifying', () => {
    const [plan] = reconcile([], [breach()]);

    expect(plan).toMatchObject({
      action: 'create',
      incident: { status: 'PENDING', breachCount: 1 },
      notification: null,
    });
  });

  it('opens on the second consecutive breach and notifies', () => {
    const [plan] = reconcile(
      [
        incident({
          status: 'PENDING',
          breachCount: 1,
          openedAt: null,
          notifyCount: 0,
          lastNotifiedAt: null,
        }),
      ],
      [breach()],
    );

    expect(plan).toMatchObject({
      action: 'update',
      incident: { status: 'OPEN', openedAt: NOW },
      notification: 'OPENED',
    });
  });

  it('records a restart as a closed event with one notification', () => {
    const [plan] = reconcile(
      [],
      [
        breach({
          dedupeKey: 'api.shard1:mida-api:SERVICE_RESTARTS',
          metric: 'SERVICE_RESTARTS',
          isEvent: true,
          opensImmediately: true,
        }),
      ],
    );

    expect(plan).toMatchObject({
      action: 'create',
      incident: { status: 'RESOLVED' },
      notification: 'EVENT',
    });
  });

  it('does not repeat an alert inside the reminder window', () => {
    const [plan] = reconcile([incident()], [breach()]);

    expect(plan).toMatchObject({
      action: 'update',
      notification: null,
      incident: { peakValue: 84.1, lastValue: 82.9 },
    });
  });

  it('reminds once the window has passed', () => {
    const [plan] = reconcile(
      [incident({ lastNotifiedAt: '2026-10-21T00:20:00.000Z' })],
      [breach()],
    );

    expect(plan).toMatchObject({ notification: 'REMINDER' });
  });

  it('sends the first alert of an incident held back off hours', () => {
    const [plan] = reconcile(
      [incident({ lastNotifiedAt: null, notifyCount: 0 })],
      [breach()],
    );

    expect(plan).toMatchObject({ notification: 'OPENED' });
  });

  it('notifies an escalation at once, even when acknowledged', () => {
    const [plan] = reconcile(
      [incident({ status: 'ACKNOWLEDGED' })],
      [breach({ severity: 'CRITICAL', value: 97 })],
    );

    expect(plan).toMatchObject({
      notification: 'ESCALATED',
      incident: { severity: 'CRITICAL', peakSeverity: 'CRITICAL' },
    });
  });

  it('never reminds about an acknowledged incident', () => {
    const [plan] = reconcile(
      [
        incident({
          status: 'ACKNOWLEDGED',
          lastNotifiedAt: '2026-10-20T00:00:00.000Z',
        }),
      ],
      [breach()],
    );

    expect(plan).toMatchObject({ notification: null });
  });

  it('resolves an incident whose breach is gone and sends the recovery', () => {
    const [plan] = reconcile([incident()], []);

    expect(plan).toMatchObject({
      action: 'update',
      incident: { status: 'RESOLVED', resolvedAt: NOW },
      notification: 'RESOLVED',
    });
  });

  it('drops a pending incident that recovered before opening', () => {
    expect(reconcile([incident({ status: 'PENDING' })], [])).toEqual([
      { action: 'delete', incidentId: 'incident-1' },
    ]);
  });

  it('leaves incidents alone that cannot be judged this poll', () => {
    const plans = reconcileHealthIncidents({
      activeIncidents: [incident()],
      breaches: [],
      policy: POLICY,
      now: NOW,
      canResolve: (candidate) => candidate.metric === 'ENDPOINT_UNREACHABLE',
    });

    expect(plans).toEqual([]);
  });
});
