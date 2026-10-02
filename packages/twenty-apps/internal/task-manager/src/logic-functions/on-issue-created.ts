import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_ISSUE_CREATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { buildIssueKey, hasIssueKey } from '../utils/build-issue-key.util';
import { resolveEffectiveAppId } from './app-scope/resolve-effective-app-id.util';
import { createAppClient } from './utils/create-app-client.util';
import { reserveProjectIssueNumbers } from './utils/reserve-project-issue-numbers.util';

type IssueRow = {
  issueKey?: string | null;
  projectId?: string | null;
  appId?: string | null;
  reporterId?: string | null;
};

type IssueCreateEvent = {
  recordId: string;
  workspaceMemberId?: string;
  properties: { after: IssueRow };
};

// What the create-issue route does for its own callers, done for every other
// way an issue can appear: the record table, an import, another app. Each step
// is skipped when the row already carries the value, so an issue created
// through the route is left untouched.
const handler = async (event: DatabaseEventPayload<IssueCreateEvent>) => {
  const client = createAppClient();
  const issue = event.properties.after;
  const projectId = issue.projectId ?? null;
  const data: Record<string, unknown> = {};

  if (projectId !== null && !hasIssueKey(issue.issueKey)) {
    const reservation = await reserveProjectIssueNumbers({
      client,
      projectId,
      count: 1,
    });

    if (reservation !== null) {
      data.issueKey = buildIssueKey(
        reservation.key,
        reservation.firstIssueNumber,
      );
    }
  }

  // The app-scope mirror. A member could not have created this row without it
  // — the predicate refuses a row it cannot see — so this is for rows created
  // by somebody who bypasses app-scope, whose issues would otherwise be
  // invisible to the whole team.
  if (projectId !== null && issue.appId === null) {
    data.appId = await resolveEffectiveAppId({
      client,
      objectNameSingular: 'issue',
      immediateForeignKeyValue: projectId,
    });
  }

  if (
    issue.reporterId === null &&
    typeof event.workspaceMemberId === 'string'
  ) {
    data.reporterId = event.workspaceMemberId;
  }

  if (Object.keys(data).length === 0) {
    await recordIssueCreated({ client, event, appId: issue.appId ?? null });

    return { updated: false };
  }

  await client.mutation({
    updateIssue: { __args: { id: event.recordId, data }, id: true },
  });

  await recordIssueCreated({
    client,
    event,
    appId:
      typeof data.appId === 'string' && data.appId.length > 0
        ? data.appId
        : (issue.appId ?? null),
  });

  return { updated: true, fields: Object.keys(data) };
};

// The History tab's `created` entry. Written here rather than in the
// create-issue route so imports, the record table and other apps count the
// same. Runs after the backfill above, so the entry carries the final app.
const recordIssueCreated = async ({
  client,
  event,
  appId,
}: {
  client: ApiClient;
  event: DatabaseEventPayload<IssueCreateEvent>;
  appId: string | null;
}): Promise<void> => {
  if (appId === null) {
    return;
  }

  const reporterId =
    typeof event.workspaceMemberId === 'string'
      ? event.workspaceMemberId
      : (event.properties.after.reporterId ?? null);

  await client.mutation({
    createIssueHistory: {
      __args: {
        data: {
          issueId: event.recordId,
          action: 'created',
          authorId: reporterId,
          appId,
        },
      },
      id: true,
    },
  });
};

export default defineLogicFunction({
  universalIdentifier: ON_ISSUE_CREATED_LOGIC_FUNCTION_UID,
  name: 'complete-issue-on-created',
  description:
    'Assigns the issue key, the app-scope mirror and the default reporter to an issue created outside the app routes.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'issue.created' },
  handler,
});
