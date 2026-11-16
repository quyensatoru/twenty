import { type ApiClient } from '../../types/api-client';
import { type BcIssueRecord } from '../../types/bc-records';
import { appendHistory } from '../../utils/history.util';
import {
  buildIssueReminderKey,
  buildIssueTaskKey,
} from '../../utils/trigger-keys.util';
import { recordActivity } from './activity-store.util';
import { readTaskByTriggerKey } from './auto-task.util';
import { updateRecord } from './record-store.util';

const DAY_MS = 86_400_000;
export const ISSUE_REMINDER_INTERVAL_DAYS = 7;

// The agreed semantics for an issue left open: no new task and no deadline,
// just one reminder a week on the issue's own follow-up task, so it climbs
// back into the BC's recent activity.
export const remindUnresolvedIssue = async ({
  client,
  issue,
  now,
}: {
  client: ApiClient;
  issue: BcIssueRecord;
  now: string;
}): Promise<boolean> => {
  if (issue.status !== 'OPEN' || issue.vipClientId === null) {
    return false;
  }

  const task = await readTaskByTriggerKey(client, buildIssueTaskKey(issue.id));

  if (task === null || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    return false;
  }

  const lastReminderAt = [...(task.history ?? [])]
    .reverse()
    .find((entry) => entry.action === 'REMINDER')?.at;
  const since = Date.parse(lastReminderAt ?? issue.detectedAt ?? issue.createdAt);

  if (Date.parse(now) - since < ISSUE_REMINDER_INTERVAL_DAYS * DAY_MS) {
    return false;
  }

  const openDays = Math.floor(
    (Date.parse(now) - Date.parse(issue.detectedAt ?? issue.createdAt)) / DAY_MS,
  );

  await updateRecord({
    client,
    objectNameSingular: 'bcTask',
    id: task.id,
    data: {
      history: appendHistory(task.history, {
        actorMemberId: null,
        action: 'REMINDER',
        note: `Issue still open after ${openDays} days`,
        at: now,
      }),
    },
  });

  await recordActivity(client, {
    vipClientId: issue.vipClientId,
    type: 'TASK',
    title: `Follow up on issue: ${issue.title ?? ''}`,
    summary: `Issue still open after ${openDays} days`,
    direction: 'INTERNAL',
    topic: 'ISSUE',
    occurredAt: now,
    externalId: buildIssueReminderKey(issue.id, now.slice(0, 10)),
    metadata: { issueId: issue.id, taskId: task.id, reminder: true },
  });

  return true;
};
