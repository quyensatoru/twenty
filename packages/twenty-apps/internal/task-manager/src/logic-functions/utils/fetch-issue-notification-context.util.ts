import { type ApiClient } from '../../types/api-client';
import { listScopedRecords } from './list-scoped-records.util';
import { type NotificationIssue } from './build-notification-email.util';

export type IssueNotificationContext = NotificationIssue & {
  assigneeId: string | null;
  reporterId: string | null;
};

// The handful of issue fields a notification email needs (subject line, link,
// who else to notify) — narrower than ISSUE_SELECTION, which also hydrates
// the description and every planning field no email cares about.
export const fetchIssueNotificationContext = async (
  client: ApiClient,
  issueId: string,
): Promise<IssueNotificationContext | null> => {
  const [issue] = await listScopedRecords<IssueNotificationContext>({
    client,
    pluralName: 'issues',
    filter: { id: { eq: issueId } },
    selection: {
      id: true,
      title: true,
      issueKey: true,
      assigneeId: true,
      reporterId: true,
    },
    maxRecords: 1,
  });

  return issue ?? null;
};
