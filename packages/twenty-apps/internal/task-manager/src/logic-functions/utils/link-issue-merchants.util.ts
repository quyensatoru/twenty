import { type ApiClient } from '../../types/api-client';
import { type Connection } from '../../types/connection';
import { isUniqueConstraintError } from '../../utils/is-unique-constraint-error.util';
import { resolveEffectiveAppId } from '../app-scope/resolve-effective-app-id.util';

type IssueMerchantRow = {
  id: string;
  merchantId: string;
  appId?: string | null;
  deletedAt?: string | null;
};

const readIssueMerchants = async ({
  client,
  issueId,
  includeDeleted,
}: {
  client: ApiClient;
  issueId: string;
  includeDeleted: boolean;
}): Promise<IssueMerchantRow[]> => {
  const result = await client.query({
    issueMerchants: {
      __args: {
        filter: {
          issueId: { eq: issueId },
          // A soft-deleted row is excluded by default, which is right for the
          // links an issue HAS and wrong for deciding what can be created.
          ...(includeDeleted ? { deletedAt: { is: 'NOT_NULL' } } : {}),
        },
        first: 200,
      },
      edges: {
        node: { id: true, merchantId: true, appId: true, deletedAt: true },
      },
    },
  });

  const connection = result?.issueMerchants as
    | Connection<IssueMerchantRow>
    | undefined;

  return (connection?.edges ?? []).map((edge) => edge.node);
};

// Reconciles the issueMerchant junction to exactly `merchantIds`.
//
// Unlinking soft-deletes, and the unique index on (merchantId, issueId) counts
// soft-deleted rows, so re-linking a merchant that was ever unlinked cannot be
// a create: it raises a unique violation. That violation used to be swallowed
// as "somebody linked it concurrently", which left the link silently unmade and
// the route reporting success — a merchant removed once could never be put
// back. The deleted row is restored instead.
export const linkIssueMerchants = async ({
  client,
  issueId,
  merchantIds,
}: {
  client: ApiClient;
  issueId: string;
  merchantIds: readonly string[];
}): Promise<void> => {
  const existing = await readIssueMerchants({
    client,
    issueId,
    includeDeleted: false,
  });
  const existingMerchantIds = new Set(existing.map((row) => row.merchantId));
  const wantedMerchantIds = new Set(merchantIds);

  const missingMerchantIds = [...wantedMerchantIds].filter(
    (merchantId) => !existingMerchantIds.has(merchantId),
  );

  if (missingMerchantIds.length > 0) {
    const deletedRows = await readIssueMerchants({
      client,
      issueId,
      includeDeleted: true,
    });
    const deletedRowByMerchantId = new Map(
      deletedRows.map((row) => [row.merchantId, row]),
    );

    for (const merchantId of missingMerchantIds) {
      const deletedRow = deletedRowByMerchantId.get(merchantId);

      // App-scope mirror: issueMerchant is scoped through its merchant, and the
      // predicate reads the mirror, so a row without one is invisible to every
      // scoped member.
      const appId = await resolveEffectiveAppId({
        client,
        objectNameSingular: 'issueMerchant',
        immediateForeignKeyValue: merchantId,
      });

      if (deletedRow !== undefined) {
        await client.mutation({
          restoreIssueMerchant: { __args: { id: deletedRow.id }, id: true },
        });

        // A row created before the mirror existed comes back without one.
        if (
          typeof deletedRow.appId !== 'string' &&
          typeof appId === 'string'
        ) {
          await client.mutation({
            updateIssueMerchant: {
              __args: { id: deletedRow.id, data: { appId } },
              id: true,
            },
          });
        }

        continue;
      }

      try {
        await client.mutation({
          createIssueMerchant: {
            __args: { data: { issueId, merchantId, appId } },
            id: true,
          },
        });
      } catch (error) {
        // Only a genuine race now: a row this call could have restored was
        // looked for first.
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
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
