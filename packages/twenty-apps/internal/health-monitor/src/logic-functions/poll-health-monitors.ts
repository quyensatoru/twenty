import { defineLogicFunction } from 'twenty-sdk/define';

import { HEALTH_POLL_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { isMonitorDue } from '../utils/is-monitor-due.util';
import { createAppClient } from './utils/create-app-client.util';
import { findDashboardUrl } from './utils/find-dashboard-url.util';
import { listHealthMonitors } from './utils/health-monitor-store.util';
import { listApps } from './utils/list-apps.util';
import { listWorkspaceMembers } from './utils/list-member-emails.util';
import {
  pollHealthMonitor,
  type PollSummary,
} from './utils/poll-health-monitor.util';
import { readErrorMessage } from './utils/read-error-message.util';

const handler = async () => {
  const client = createAppClient();
  const now = new Date().toISOString();
  const due = (
    await listHealthMonitors({ client, filter: { isEnabled: { eq: true } } })
  ).filter((monitor) => isMonitorDue(monitor, now));

  if (due.length === 0) {
    return { polled: 0 };
  }

  const appNameById = new Map(
    (await listApps(client)).map((app) => [app.id, app.name]),
  );
  const dashboardUrl = await findDashboardUrl();
  let memberEmails: Promise<Map<string, string>> | null = null;
  const loadMemberEmails = () => {
    memberEmails ??= listWorkspaceMembers(client).then(
      (members) =>
        new Map(
          members.flatMap((member) =>
            member.email === null ? [] : [[member.id, member.email] as const],
          ),
        ),
    );

    return memberEmails;
  };

  // Each monitor runs on its own: one slow or broken endpoint must not hold
  // back, or fail, the others.
  const results = await Promise.allSettled(
    due.map((monitor) =>
      pollHealthMonitor(monitor, {
        client,
        now,
        appName:
          (monitor.appId === null
            ? undefined
            : appNameById.get(monitor.appId)) ?? monitor.name,
        dashboardUrl,
        loadMemberEmails,
      }),
    ),
  );

  return {
    polled: due.length,
    results: results.map((result, index) =>
      result.status === 'fulfilled'
        ? (result.value as PollSummary)
        : { monitorId: due[index].id, error: readErrorMessage(result.reason) },
    ),
  };
};

export default defineLogicFunction({
  universalIdentifier: HEALTH_POLL_LOGIC_FUNCTION_UID,
  name: 'poll-health-monitors',
  description:
    'Every minute: polls each enabled monitor that is due, stores a snapshot and emails on threshold changes.',
  timeoutSeconds: 120,
  cronTriggerSettings: {
    pattern: '* * * * *',
  },
  handler,
});
