import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { APPEND_ISSUE_ATTACHMENT_ROUTE_PATH } from '../constants/route-paths';
import { APPEND_ISSUE_ATTACHMENT_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { type Connection } from '../types/connection';
import { assertRecordInScope } from './app-scope/assert-record-in-scope.util';
import { requireString } from './utils/require-string.util';
import { runScopedRoute } from './utils/run-scoped-route.util';

type AppendIssueAttachmentBody = {
  issueId?: string;
  file?: { fileId?: string; label?: string };
};

const handler = async (event: RoutePayload<AppendIssueAttachmentBody>) =>
  runScopedRoute(async ({ client, scope }) => {
    const issueId = requireString(event.body?.issueId, 'issueId');
    const fileId = requireString(event.body?.file?.fileId, 'file.fileId');

    await assertRecordInScope({
      client,
      scope,
      objectNameSingular: 'issue',
      recordId: issueId,
      operation: 'write',
    });

    const label =
      typeof event.body?.file?.label === 'string' &&
      event.body.file.label !== ''
        ? event.body.file.label
        : fileId;

    const issueResult = await client.query({
      issues: {
        __args: { filter: { id: { eq: issueId } }, first: 1 },
        edges: {
          node: { id: true, attachments: { fileId: true, label: true } },
        },
      },
    });

    const issueConnection = issueResult?.issues as
      | Connection<{
          id: string;
          attachments?: { fileId?: string | null; label?: string | null }[] | null;
        }>
      | undefined;
    const issue = issueConnection?.edges?.[0]?.node ?? null;

    if (issue === null) {
      throw new Error('Issue not found.');
    }

    const current = Array.isArray(issue.attachments)
      ? issue.attachments
      : [];

    // Filing is idempotent: a retried upload lands on the fileId already
    // being there instead of duplicating the row.
    if (
      current.some((entry) => entry?.fileId === fileId)
    ) {
      return { issue, appended: false };
    }

    const attachments = [
      ...current
        .filter(
          (entry): entry is { fileId: string; label?: string | null } =>
            typeof entry?.fileId === 'string',
        )
        .map((entry) => ({ fileId: entry.fileId, label: entry.label ?? '' })),
      { fileId, label },
    ];

    const result = await client.mutation({
      updateIssue: {
        __args: { id: issueId, data: { attachments } },
        id: true,
      },
    });

    return { issue: result?.updateIssue ?? null, appended: true };
  });

export default defineLogicFunction({
  universalIdentifier: APPEND_ISSUE_ATTACHMENT_LOGIC_FUNCTION_UID,
  name: 'append-issue-attachment',
  description:
    "Route: files one stored upload against an issue's attachments, skipping it when the file is already there.",
  timeoutSeconds: 60,
  httpRouteTriggerSettings: {
    path: APPEND_ISSUE_ATTACHMENT_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
  handler,
});
