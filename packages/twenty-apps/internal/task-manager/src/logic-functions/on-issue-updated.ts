import { defineLogicFunction } from 'twenty-sdk/define';
import { type DatabaseEventPayload } from 'twenty-sdk/logic-function';

import { ON_ISSUE_UPDATED_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type ApiClient } from '../types/api-client';
import { type Connection } from '../types/connection';
import { resolveAcceptanceCriteriaChanges } from '../utils/resolve-acceptance-criteria-changes.util';
import { resolveIssueStatusChange } from '../utils/resolve-issue-status-change.util';
import { createAppClient } from './utils/create-app-client.util';

type IssueRow = {
  statusId?: string | null;
  acceptanceCriteria?: unknown;
  appId?: string | null;
};

type IssueUpdateEvent = {
  recordId: string;
  workspaceMemberId?: string;
  properties: { before?: IssueRow | null; after?: IssueRow | null };
};

// The History tab's `status-changed` and acceptance-criteria entries.
// Registered on `issue.updated` so every way of changing an issue counts the
// same: the board drag, the Details panel, the record table, another app.
//
// Only a real change writes: the backfill in `issue.created` and every
// unrelated edit arrive with these fields untouched and leave no entry.
const handler = async (event: DatabaseEventPayload<IssueUpdateEvent>) => {
  const statusChange = resolveIssueStatusChange({
    before: event.properties.before,
    after: event.properties.after,
  });
  const criteriaChanges = resolveAcceptanceCriteriaChanges({
    before: event.properties.before,
    after: event.properties.after,
  });

  if (statusChange === null && criteriaChanges.length === 0) {
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

  const entries = [
    ...(statusChange === null
      ? []
      : [
          {
            action: 'status-changed',
            fromStatusId: statusChange.fromStatusId,
            toStatusId: statusChange.toStatusId,
          },
        ]),
    ...criteriaChanges.map((change) => ({
      action: change.action,
      detail: change.text,
    })),
  ];
  const authorId =
    typeof event.workspaceMemberId === 'string'
      ? event.workspaceMemberId
      : null;

  await client.mutation({
    createIssueHistories: {
      __args: {
        data: entries.map((entry) => ({
          ...entry,
          issueId,
          authorId,
          appId,
        })),
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
    Connection<{ id: string; appId?: string | null }> | undefined;

  return connection?.edges?.[0]?.node?.appId ?? null;
};

export default defineLogicFunction({
  universalIdentifier: ON_ISSUE_UPDATED_LOGIC_FUNCTION_UID,
  name: 'record-history-on-issue-updated',
  description:
    'Writes issue history entries when an issue status moves or its acceptance criteria are added, removed or ticked.',
  timeoutSeconds: 60,
  databaseEventTriggerSettings: { eventName: 'issue.updated' },
  handler,
});
