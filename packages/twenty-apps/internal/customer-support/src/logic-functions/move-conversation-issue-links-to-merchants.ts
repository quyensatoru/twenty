import { defineLogicFunction } from 'twenty-sdk/define';

import { MOVE_CONVERSATION_ISSUE_LINKS_TO_MERCHANTS_LOGIC_FUNCTION_UID } from '../constants/universal-identifiers';
import { createAppClient } from './utils/create-app-client.util';
import { executeWithRetry } from './utils/execute-with-retry.util';
import { linkMerchantToIssues } from './utils/issue-merchant-links.util';

type ConversationIssueLink = {
  id: string;
  issueId: string | null;
  conversation: { merchant: { id?: string; appId?: string | null } | null };
};

const PAGE_SIZE = 100;

// Direct chat <-> issue links made before a chat reached its issues through
// its merchant: each one whose chat has a merchant becomes that merchant on
// the issue, and the direct link goes. Links of chats without a merchant stay.
// Run it after relink-crisp-conversation-merchants, until `moved` is 0.
const handler = async () => {
  const client = createAppClient();
  let after: string | null = null;
  let scanned = 0;
  let moved = 0;

  for (;;) {
    const result = await executeWithRetry<{
      crispConversationIssues?: {
        edges?: { node: ConversationIssueLink }[];
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      };
    }>(() =>
      client.query({
        crispConversationIssues: {
          __args: {
            first: PAGE_SIZE,
            orderBy: [{ id: 'AscNullsLast' }],
            ...(after === null ? {} : { after }),
          },
          edges: {
            node: {
              id: true,
              issueId: true,
              conversation: { merchant: { id: true, appId: true } },
            },
          },
          pageInfo: { hasNextPage: true, endCursor: true },
        },
      }),
    );
    const connection = result?.crispConversationIssues;
    const movedIds: string[] = [];

    for (const { node: link } of connection?.edges ?? []) {
      scanned += 1;

      const merchant = link.conversation?.merchant;

      if (typeof merchant?.id !== 'string' || link.issueId === null) {
        continue;
      }

      await linkMerchantToIssues({
        client,
        merchant: { id: merchant.id, appId: merchant.appId ?? null },
        issueIds: [link.issueId],
      });
      movedIds.push(link.id);
    }

    if (movedIds.length > 0) {
      await executeWithRetry(() =>
        client.mutation({
          destroyCrispConversationIssues: {
            __args: { filter: { id: { in: movedIds } } },
            id: true,
          },
        }),
      );
      moved += movedIds.length;
    }

    after = connection?.pageInfo?.endCursor ?? null;

    if (connection?.pageInfo?.hasNextPage !== true || after === null) {
      return { scanned, moved };
    }
  }
};

export default defineLogicFunction({
  universalIdentifier: MOVE_CONVERSATION_ISSUE_LINKS_TO_MERCHANTS_LOGIC_FUNCTION_UID,
  name: 'move-conversation-issue-links-to-merchants',
  description:
    "One-off: turns direct chat-issue links into the chat's merchant on the issue, for chats that have a merchant.",
  timeoutSeconds: 600,
  handler,
});
