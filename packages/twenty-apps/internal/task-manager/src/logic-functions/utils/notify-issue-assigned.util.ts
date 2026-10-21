import { isNonEmptyString } from '@sniptt/guards';

import { type ApiClient } from '../../types/api-client';
import { buildIssueAssignedEmail, type NotificationIssue } from './build-notification-email.util';
import { formatMemberName } from './discussion-storage.util';
import { fetchMembersById } from './fetch-members-by-id.util';
import { sendNotificationEmail } from './send-notification-email.util';

// Best-effort: an email provider outage must never fail the create/update
// route whose job is the issue write, not the notification.
export const notifyIssueAssigned = async ({
  client,
  issue,
  assigneeId,
  actorId,
}: {
  client: ApiClient;
  issue: NotificationIssue;
  assigneeId: string;
  actorId: string | null;
}): Promise<void> => {
  if (assigneeId === actorId) return;

  try {
    const members = await fetchMembersById(
      client,
      actorId === null ? [assigneeId] : [assigneeId, actorId],
    );
    const assignee = members.get(assigneeId);
    if (!isNonEmptyString(assignee?.userEmail)) return;

    const email = buildIssueAssignedEmail({
      issue,
      actorName: formatMemberName(
        actorId === null ? undefined : members.get(actorId),
      ),
    });
    const result = await sendNotificationEmail(assignee.userEmail, email);
    if (!result.ok) {
      console.error('Issue assigned notification email failed', result.error);
    }
  } catch (error) {
    console.error('Issue assigned notification email failed', error);
  }
};
