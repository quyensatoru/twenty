import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_WORKLOG_CHANGED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import { recomputeIssueTimeTracking } from './utils/recompute-issue-time-tracking.util';

type WorklogRow = { issueId?: string | null };

type WorklogChangeEvent = {
  recordId: string;
  properties: { before?: WorklogRow | null; after?: WorklogRow | null };
};

// `issue.timeSpentMinutes` and `remainingEstimateMinutes` are sums over the
// worklogs, and a sum kept by one write path drifts the moment another one
// appears. Registered on `worklog.*` so a row logged from the record table
// counts the same as one logged through the route.
//
// Moving a worklog to another issue has to settle both: the one it left and
// the one it joined.
const handler = async (event: DatabaseEventPayload<WorklogChangeEvent>) => {
  const issueIds = [
    event.properties.after?.issueId,
    event.properties.before?.issueId,
  ].filter(
    (issueId, index, all): issueId is string =>
      typeof issueId === 'string' && all.indexOf(issueId) === index,
  );

  if (issueIds.length === 0) {
    return { recomputedIssueIds: [] };
  }

  await recomputeIssueTimeTracking({ client: createAppClient(), issueIds });

  return { recomputedIssueIds: issueIds };
};

export default defineLogicFunction({
  universalIdentifier: ON_WORKLOG_CHANGED_LOGIC_FUNCTION_UID,
  name: 'recompute-time-on-worklog-changed',
  description:
    'Recomputes the time tracking totals of the issues a worklog change touches.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'worklog.*' },
  handler,
});
