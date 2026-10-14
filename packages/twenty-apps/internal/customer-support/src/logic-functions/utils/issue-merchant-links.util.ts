import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from './execute-with-retry.util';

export type ConversationMerchant = {
  id: string;
  appId: string | null;
};

type IssueMerchantRow = {
  id: string;
  issueId: string;
  appId?: string | null;
};

// An issue concerns a handful of merchants; this caps a runaway junction.
const MAX_MERCHANT_ISSUES = 200;

export const readConversationMerchant = async (
  client: ApiClient,
  conversationId: string,
): Promise<ConversationMerchant | null> => {
  const result = await executeWithRetry<{
    crispConversations?: {
      edges?: {
        node: { merchant?: { id?: string; appId?: string | null } | null };
      }[];
    };
  }>(() =>
    client.query({
      crispConversations: {
        __args: { filter: { id: { eq: conversationId } }, first: 1 },
        edges: { node: { merchant: { id: true, appId: true } } },
      },
    }),
  );
  const merchant = result?.crispConversations?.edges?.[0]?.node?.merchant;

  return typeof merchant?.id === 'string'
    ? { id: merchant.id, appId: merchant.appId ?? null }
    : null;
};

const readIssueMerchantRows = async ({
  client,
  merchantId,
  issueIds,
  isDeleted,
}: {
  client: ApiClient;
  merchantId: string;
  issueIds: string[];
  isDeleted: boolean;
}): Promise<IssueMerchantRow[]> => {
  const result = await executeWithRetry<{
    issueMerchants?: { edges?: { node: IssueMerchantRow }[] };
  }>(() =>
    client.query({
      issueMerchants: {
        __args: {
          filter: {
            and: [
              { merchantId: { eq: merchantId } },
              { issueId: { in: issueIds } },
              // Soft-deleted rows only come back when asked for.
              ...(isDeleted ? [{ deletedAt: { is: 'NOT_NULL' } }] : []),
            ],
          },
          first: MAX_MERCHANT_ISSUES,
        },
        edges: { node: { id: true, issueId: true, appId: true } },
      },
    }),
  );

  return (result?.issueMerchants?.edges ?? []).map((edge) => edge.node);
};

// Adds the merchant to each issue, the way Task Manager links them. The unique
// (merchantId, issueId) index counts soft-deleted rows, so a link removed
// earlier is restored rather than created again. The row carries the
// merchant's app: Task Manager scopes the junction by it, and a row without
// one is invisible to every member limited to an app.
export const linkMerchantToIssues = async ({
  client,
  merchant,
  issueIds,
}: {
  client: ApiClient;
  merchant: ConversationMerchant;
  issueIds: string[];
}): Promise<void> => {
  const wantedIssueIds = [...new Set(issueIds)];

  if (wantedIssueIds.length === 0) {
    return;
  }

  const linkedIssueIds = new Set(
    (
      await readIssueMerchantRows({
        client,
        merchantId: merchant.id,
        issueIds: wantedIssueIds,
        isDeleted: false,
      })
    ).map((row) => row.issueId),
  );
  const missingIssueIds = wantedIssueIds.filter(
    (issueId) => !linkedIssueIds.has(issueId),
  );

  if (missingIssueIds.length === 0) {
    return;
  }

  const deletedRowByIssueId = new Map(
    (
      await readIssueMerchantRows({
        client,
        merchantId: merchant.id,
        issueIds: missingIssueIds,
        isDeleted: true,
      })
    ).map((row) => [row.issueId, row]),
  );

  for (const issueId of missingIssueIds) {
    const deletedRow = deletedRowByIssueId.get(issueId);

    if (deletedRow === undefined) {
      await executeWithRetry(() =>
        client.mutation({
          createIssueMerchant: {
            __args: {
              data: { issueId, merchantId: merchant.id, appId: merchant.appId },
            },
            id: true,
          },
        }),
      );

      continue;
    }

    await executeWithRetry(() =>
      client.mutation({
        restoreIssueMerchant: { __args: { id: deletedRow.id }, id: true },
      }),
    );

    if (typeof deletedRow.appId !== 'string' && merchant.appId !== null) {
      await executeWithRetry(() =>
        client.mutation({
          updateIssueMerchant: {
            __args: { id: deletedRow.id, data: { appId: merchant.appId } },
            id: true,
          },
        }),
      );
    }
  }
};

// Soft-deletes, as Task Manager does when a merchant is taken off an issue.
export const unlinkMerchantFromIssue = async ({
  client,
  merchantId,
  issueId,
}: {
  client: ApiClient;
  merchantId: string;
  issueId: string;
}): Promise<void> => {
  const rows = await readIssueMerchantRows({
    client,
    merchantId,
    issueIds: [issueId],
    isDeleted: false,
  });

  for (const row of rows) {
    await executeWithRetry(() =>
      client.mutation({
        deleteIssueMerchant: { __args: { id: row.id }, id: true },
      }),
    );
  }
};

export const readMerchantIssueIds = async (
  client: ApiClient,
  merchantId: string,
): Promise<string[]> => {
  const result = await executeWithRetry<{
    issueMerchants?: { edges?: { node: { issueId?: string | null } }[] };
  }>(() =>
    client.query({
      issueMerchants: {
        __args: {
          filter: { merchantId: { eq: merchantId } },
          first: MAX_MERCHANT_ISSUES,
          orderBy: [{ createdAt: 'AscNullsLast' }],
        },
        edges: { node: { issueId: true } },
      },
    }),
  );

  return (result?.issueMerchants?.edges ?? [])
    .map((edge) => edge.node.issueId)
    .filter((issueId): issueId is string => typeof issueId === 'string');
};
