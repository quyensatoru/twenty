import { type HealthNotification } from '../types/health-notification';
import { type HealthRecipient } from '../types/health-recipient';
import {
  HEALTH_SEVERITY_RANK,
  type HealthSeverity,
} from '../types/health-severity';

const notificationSeverity = ({
  kind,
  incident,
}: HealthNotification): HealthSeverity =>
  kind === 'RESOLVED' ? incident.peakSeverity : incident.severity;

// Returns, per address, the notifications that address asked for. Extra
// addresses have no member behind them and take every severity.
export const selectAlertRecipients = ({
  notifications,
  recipients,
  emailByMemberId,
  extraEmails,
  criticalOnly,
}: {
  notifications: HealthNotification[];
  recipients: HealthRecipient[];
  emailByMemberId: Map<string, string>;
  extraEmails: string[];
  criticalOnly: boolean;
}): Map<string, HealthNotification[]> => {
  const deliverable = criticalOnly
    ? notifications.filter(
        (notification) => notificationSeverity(notification) === 'CRITICAL',
      )
    : notifications;
  const byEmail = new Map<string, HealthNotification[]>();

  const add = (email: string, minSeverity: HealthSeverity) => {
    const normalized = email.trim().toLowerCase();

    if (normalized.length === 0) {
      return;
    }

    const wanted = deliverable.filter(
      (notification) =>
        HEALTH_SEVERITY_RANK[notificationSeverity(notification)] >=
        HEALTH_SEVERITY_RANK[minSeverity],
    );

    if (wanted.length === 0) {
      return;
    }

    const existing = byEmail.get(normalized) ?? [];

    byEmail.set(normalized, [
      ...existing,
      ...wanted.filter((notification) => !existing.includes(notification)),
    ]);
  };

  for (const recipient of recipients) {
    const email = emailByMemberId.get(recipient.memberId);

    if (email !== undefined) {
      add(email, recipient.minSeverity);
    }
  }

  for (const email of extraEmails) {
    add(email, 'WARNING');
  }

  return byEmail;
};
