import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from './execute-with-retry.util';
import {
  linkMerchantToIssues,
  readConversationMerchant,
  unlinkMerchantFromIssue,
} from './issue-merchant-links.util';

const readLinkedIssueIds = async (
  client: ApiClient,
  conversationId: string,
): Promise<Set<string>> => {
  const result = await executeWithRetry<{
    crispConversationIssues?: {
      edges?: { node: { issueId?: string | null } }[];
    };
  }>(() =>
    client.query({
      crispConversationIssues: {
        __args: {
          filter: { conversationId: { eq: conversationId } },
          first: 200,
        },
        edges: { node: { issueId: true } },
      },
    }),
  );

  return new Set(
    (result?.crispConversationIssues?.edges ?? [])
      .map((edge) => edge.node.issueId)
      .filter((issueId): issueId is string => typeof issueId === 'string'),
  );
};

// Creates the direct links that are missing; an existing link is left alone so
// a repeated request never fails on the unique index.
const linkConversationIssuesDirectly = async ({
  client,
  conversationId,
  issueIds,
}: {
  client: ApiClient;
  conversationId: string;
  issueIds: string[];
}): Promise<number> => {
  if (issueIds.length === 0) {
    return 0;
  }

  const linkedIssueIds = await readLinkedIssueIds(client, conversationId);
  const missing = [...new Set(issueIds)].filter(
    (issueId) => !linkedIssueIds.has(issueId),
  );

  if (missing.length === 0) {
    return 0;
  }

  await executeWithRetry(() =>
    client.mutation({
      createCrispConversationIssues: {
        __args: {
          data: missing.map((issueId) => ({ conversationId, issueId })),
        },
        id: true,
      },
    }),
  );

  return missing.length;
};

// A chat belongs to its merchant, so linking it to an issue adds the merchant
// to the issue, and the issue lists the merchant's chats from there. Only a
// chat no merchant was matched to is linked to the issue directly.
export const linkIssuesToConversation = async ({
  client,
  conversationId,
  issueIds,
}: {
  client: ApiClient;
  conversationId: string;
  issueIds: string[];
}): Promise<void> => {
  const merchant = await readConversationMerchant(client, conversationId);

  if (merchant === null) {
    await linkConversationIssuesDirectly({ client, conversationId, issueIds });

    return;
  }

  await linkMerchantToIssues({ client, merchant, issueIds });
};

// Removes whichever link puts the issue on the chat: the merchant on the
// issue, and a direct link made while the chat had no merchant.
export const unlinkIssueFromConversation = async ({
  client,
  conversationId,
  issueId,
}: {
  client: ApiClient;
  conversationId: string;
  issueId: string;
}): Promise<void> => {
  await executeWithRetry(() =>
    client.mutation({
      destroyCrispConversationIssues: {
        __args: {
          filter: {
            conversationId: { eq: conversationId },
            issueId: { eq: issueId },
          },
        },
        id: true,
      },
    }),
  );

  const merchant = await readConversationMerchant(client, conversationId);

  if (merchant !== null) {
    await unlinkMerchantFromIssue({
      client,
      merchantId: merchant.id,
      issueId,
    });
  }
};
