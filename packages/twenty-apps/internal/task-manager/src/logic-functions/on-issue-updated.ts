import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_ISSUE_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type Connection } from '../types/connection';
import { resolveIssueStatusChange } from '../utils/resolve-issue-status-change.util';
import { createAppClient } from './utils/create-app-client.util';

type IssueRow = {
  statusId?: string | null;
  appId?: string | null;
};

type IssueUpdateEvent = {
  recordId: string;
  workspaceMemberId?: string;
  properties: { before?: IssueRow | null; after?: IssueRow | null };
};

// The History tab's `status-changed` entries. Registered on `issue.updated`
// so every way of moving a card counts the same: the board drag, the Details
// panel, the record table, another app.
//
// Only a real status move writes: the backfill in `issue.created` and every
// unrelated edit arrive with the status untouched and leave no entry.
const handler = async (event: DatabaseEventPayload<IssueUpdateEvent>) => {
  const change = resolveIssueStatusChange({
    before: event.properties.before,
    after: event.properties.after,
  });

  if (change === null) {
    return { recorded: false };
  }

  const client = createAppClient();
  const issueId = event.recordId;
  const appId =
    event.properties.after?.appId ?? (await readIssueAppId(client, issueId));

  // Fail-closed like every other mirror write: an entry without an app is
  // invisible to the whole team, so a missing app skips the entry rather
  // than orphaning one.
  if (appId === null) {
    return { recorded: false };
  }

  await client.mutation({
    createIssueHistory: {
      __args: {
        data: {
          issueId,
          action: 'status-changed',
          fromStatusId: change.fromStatusId,
          toStatusId: change.toStatusId,
          authorId:
            typeof event.workspaceMemberId === 'string'
              ? event.workspaceMemberId
              : null,
          appId,
        },
      },
      id: true,
    },
  });

  return { recorded: true };
};

const readIssueAppId = async (
  client: ApiClient,
  issueId: string,
): Promise<string | null> => {
  const result = await client.query({
    issues: {
      __args: { filter: { id: { eq: issueId } }, first: 1 },
      edges: { node: { id: true, appId: true } },
    },
  });

  const connection = result?.issues as
    | Connection<{ id: string; appId?: string | null }>
    | undefined;

  return connection?.edges?.[0]?.node?.appId ?? null;
};

export default defineLogicFunction({
  universalIdentifier: ON_ISSUE_UPDATED_LOGIC_FUNCTION_UID,
  name: 'record-history-on-issue-updated',
  description:
    'Writes a status-changed issue history entry whenever an issue status moves.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'issue.updated' },
  handler,
});
