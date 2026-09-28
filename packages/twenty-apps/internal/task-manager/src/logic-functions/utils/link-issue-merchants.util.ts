import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { isUniqueConstraintError } from '../../utils/is-unique-constraint-error.util';

// Reconciles the issueMerchant junction to exactly `merchantIds`. The unique
// index on (merchantId, issueId) makes a concurrent double-link a unique
// violation rather than a duplicate row, so that specific failure is absorbed.
export const linkIssueMerchants = async ({
  client,
  issueId,
  merchantIds,
}: {
  client: ApiClient;
  issueId: string;
  merchantIds: readonly string[];
}): Promise<void> => {
  const existingResult = await client.query({
    issueMerchants: {
      __args: { filter: { issueId: { eq: issueId } }, first: 200 },
      edges: { node: { id: true, merchantId: true } },
    },
  });

  const connection = existingResult?.issueMerchants as
    | Connection<{ id: string; merchantId: string }>
    | undefined;
  const existing = (connection?.edges ?? []).map((edge) => edge.node);
  const existingMerchantIds = new Set(existing.map((row) => row.merchantId));
  const wantedMerchantIds = new Set(merchantIds);

  for (const merchantId of wantedMerchantIds) {
    if (existingMerchantIds.has(merchantId)) {
      continue;
    }

    try {
      await client.mutation({
        createIssueMerchant: {
          __args: { data: { issueId, merchantId } },
          id: true,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  for (const row of existing) {
    if (wantedMerchantIds.has(row.merchantId)) {
      continue;
    }

    await client.mutation({
      deleteIssueMerchant: { __args: { id: row.id }, id: true },
    });
  }
};
