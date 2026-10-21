import { describe, expect, it } from 'vitest';

import { type HealthIncidentDraft } from '../../types/health-incident-plan';
import { type HealthNotification } from '../../types/health-notification';
import { selectAlertRecipients } from '../select-alert-recipients.util';

const notification = (
  kind: HealthNotification['kind'],
  severity: 'WARNING' | 'CRITICAL',
  peakSeverity = severity,
): HealthNotification => ({
  kind,
  incident: {
    severity,
    peakSeverity,
    title: `${kind}-${severity}`,
  } as HealthIncidentDraft,
});

const emailByMemberId = new Map([
  ['member-all', 'All@Example.com'],
  ['member-critical', 'critical@example.com'],
]);

const recipients = [
  { memberId: 'member-all', minSeverity: 'WARNING' as const },
  { memberId: 'member-critical', minSeverity: 'CRITICAL' as const },
  { memberId: 'member-without-email', minSeverity: 'WARNING' as const },
];

describe('selectAlertRecipients', () => {
  it('gives each listed member only the severities they asked for', () => {
    const warning = notification('OPENED', 'WARNING');
    const critical = notification('OPENED', 'CRITICAL');
    const result = selectAlertRecipients({
      notifications: [warning, critical],
      recipients,
      emailByMemberId,
      extraEmails: [],
      criticalOnly: false,
    });

    expect(result.get('all@example.com')).toEqual([warning, critical]);
    expect(result.get('critical@example.com')).toEqual([critical]);
    expect(result.size).toBe(2);
  });

  it('judges a recovery by the worst severity the incident reached', () => {
    const recovered = notification('RESOLVED', 'WARNING', 'CRITICAL');
    const result = selectAlertRecipients({
      notifications: [recovered],
      recipients,
      emailByMemberId,
      extraEmails: [],
      criticalOnly: false,
    });

    expect(result.get('critical@example.com')).toEqual([recovered]);
  });

  it('keeps only critical notifications off hours, for extra addresses too', () => {
    const result = selectAlertRecipients({
      notifications: [notification('OPENED', 'WARNING')],
      recipients,
      emailByMemberId,
      extraEmails: ['ops@example.com'],
      criticalOnly: true,
    });

    expect(result.size).toBe(0);
  });

  it('sends extra addresses every severity', () => {
    const warning = notification('REMINDER', 'WARNING');
    const result = selectAlertRecipients({
      notifications: [warning],
      recipients: [],
      emailByMemberId,
      extraEmails: ['ops@example.com'],
      criticalOnly: false,
    });

    expect(result.get('ops@example.com')).toEqual([warning]);
  });
});
