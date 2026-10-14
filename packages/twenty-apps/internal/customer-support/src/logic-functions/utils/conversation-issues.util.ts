import { type ApiClient } from '../../types/api-client';
import { type SupportInboxIssue } from '../../types/support-inbox';
import { executeWithRetry } from './execute-with-retry.util';
import {
  readConversationMerchant,
  readMerchantIssueIds,
} from './issue-merchant-links.util';

type IssueNode = {
  id: string;
  title?: string | null;
  issueKey?: string | null;
  status?: { name?: string | null; color?: string | null } | null;
};

export const SUPPORT_INBOX_ISSUE_SELECTION = {
  id: true,
  title: true,
  issueKey: true,
  status: { name: true, color: true },
} as const;

export const toSupportInboxIssue = (node: IssueNode): SupportInboxIssue => ({
  id: node.id,
  title: node.title ?? null,
  issueKey: node.issueKey ?? null,
  statusName: node.status?.name ?? null,
  statusColor: node.status?.color ?? null,
});

// A chat links a handful of issues at most; this caps a runaway junction.
const MAX_LINKED_ISSUES = 50;

const readDirectlyLinkedIssueIds = async (
  client: ApiClient,
  conversationId: string,
): Promise<string[]> => {
  const links = await executeWithRetry<{
    crispConversationIssues?: {
      edges?: { node: { issueId?: string | null } }[];
    };
  }>(() =>
    client.query({
      crispConversationIssues: {
        __args: {
          filter: { conversationId: { eq: conversationId } },
          first: MAX_LINKED_ISSUES,
          orderBy: [{ createdAt: 'AscNullsLast' }],
        },
        edges: { node: { issueId: true } },
      },
    }),
  );

  return (links?.crispConversationIssues?.edges ?? [])
    .map((edge) => edge.node.issueId)
    .filter((issueId): issueId is string => typeof issueId === 'string');
};

// The issues the chat's merchant is on, and the ones linked to the chat
// directly while it had no merchant.
export const readConversationIssues = async (
  client: ApiClient,
  conversationId: string,
): Promise<SupportInboxIssue[]> => {
  const [directIssueIds, merchant] = await Promise.all([
    readDirectlyLinkedIssueIds(client, conversationId),
    readConversationMerchant(client, conversationId),
  ]);
  const merchantIssueIds =
    merchant === null ? [] : await readMerchantIssueIds(client, merchant.id);
  const issueIds = [...new Set([...directIssueIds, ...merchantIssueIds])];

  if (issueIds.length === 0) {
    return [];
  }

  // Read in a second query rather than nested under the link: two relation
  // hops deep the status came back empty.
  const result = await executeWithRetry<{
    issues?: { edges?: { node: IssueNode }[] };
  }>(() =>
    client.query({
      issues: {
        __args: { filter: { id: { in: issueIds } }, first: issueIds.length },
        edges: { node: SUPPORT_INBOX_ISSUE_SELECTION },
      },
    }),
  );
  const issuesById = new Map(
    (result?.issues?.edges ?? []).map((edge) => [edge.node.id, edge.node]),
  );

  // Kept in link order; an issue deleted since, or out of the role's reach,
  // is simply not listed.
  return issueIds
    .map((issueId) => issuesById.get(issueId))
    .filter((issue): issue is IssueNode => issue !== undefined)
    .map(toSupportInboxIssue);
};
