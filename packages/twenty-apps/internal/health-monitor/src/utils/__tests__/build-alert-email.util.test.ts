import { describe, expect, it } from 'vitest';

import { type HealthIncidentDraft } from '../../types/health-incident-plan';
import { type HealthNotification } from '../../types/health-notification';
import { buildAlertEmail } from '../build-alert-email.util';
import { createCatalogTranslate } from '../translate.util';

const incident = (
  overrides: Partial<HealthIncidentDraft> = {},
): HealthIncidentDraft => ({
  id: null,
  title: '',
  dedupeKey: 'hm.shard1:NODE_CPU',
  nodeKey: 'hm.shard1',
  host: '10.0.2.1',
  serviceName: null,
  metric: 'NODE_CPU',
  severity: 'WARNING',
  peakSeverity: 'WARNING',
  status: 'OPEN',
  breachCount: 2,
  lastValue: 82.9,
  peakValue: 84.1,
  threshold: 80,
  firstBreachAt: '2026-10-21T01:20:00.000Z',
  openedAt: '2026-10-21T01:21:00.000Z',
  resolvedAt: null,
  lastNotifiedAt: null,
  notifyCount: 0,
  acknowledgedByMemberId: null,
  acknowledgedAt: null,
  ...overrides,
});

const notifications: HealthNotification[] = [
  { kind: 'OPENED', incident: incident() },
  {
    kind: 'OPENED',
    incident: incident({
      metric: 'NODE_MEMORY',
      dedupeKey: 'hm.shard1:NODE_MEMORY',
      threshold: 85,
      lastValue: 86.7,
    }),
  },
];

describe('buildAlertEmail', () => {
  it('writes an English warning by default', () => {
    const email = buildAlertEmail({
      appName: 'MIDA',
      notifications,
      dashboardUrl: 'https://crm.example.com/page/1',
    });

    expect(email.subject).toBe(
      '[MIDA] WARNING: Heatmap · Shard 1: Node CPU ≥ 80% and 1 more',
    );
    expect(email.text).toContain('82.9% (threshold 80%)');
    expect(email.html).toContain('https://crm.example.com/page/1');
  });

  it('uses the catalog it is given', () => {
    const t = createCatalogTranslate({
      Warning: 'Cảnh báo',
      'Node CPU': 'CPU node',
      'and {count} more': 'và {count} vấn đề khác',
    });
    const email = buildAlertEmail({
      appName: 'MIDA',
      notifications,
      dashboardUrl: null,
      t,
    });

    expect(email.subject).toBe(
      '[MIDA] CẢNH BÁO: Heatmap · Shard 1: CPU node ≥ 80% và 1 vấn đề khác',
    );
  });

  it('names nodes the way the admin chose', () => {
    const email = buildAlertEmail({
      appName: 'MIDA',
      notifications: [notifications[0]],
      dashboardUrl: null,
      nodeLabels: { 'hm.shard1': 'Heatmap EU' },
    });

    expect(email.subject).toBe('[MIDA] WARNING: Heatmap EU: Node CPU ≥ 80%');
  });

  it('calls a recovery-only email recovered', () => {
    const email = buildAlertEmail({
      appName: 'MIDA',
      notifications: [
        { kind: 'RESOLVED', incident: incident({ status: 'RESOLVED' }) },
      ],
      dashboardUrl: null,
    });

    expect(email.subject).toBe(
      '[MIDA] RECOVERED: Heatmap · Shard 1: Node CPU ≥ 80%',
    );
  });
});
