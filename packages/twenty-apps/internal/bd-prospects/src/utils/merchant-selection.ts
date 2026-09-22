import { type Connection, type MerchantRow } from './api-types';
import { executeWithRetry, isPermanentError } from './execute-with-retry';

type ApiClient = any;

const BASE_SELECTION = {
  id: true,
  name: true,
  appId: true,
  shopifyPlan: true,
  prospectId: true,
} as const;

// The fork's merchant object is not the same everywhere: `using` and `email`
// exist on the workspace BLOY and MIDA sync into, and not on a bare one. The
// client validates a selection locally before sending it, so asking for a
// missing field throws instead of returning null, and one selection cannot
// serve both. Widest first, then narrower, until the workspace accepts one.
const CANDIDATE_EXTRAS: Record<string, unknown>[] = [
  { using: true, email: { primaryEmail: true } },
  { using: true },
  { email: { primaryEmail: true } },
  {},
];

let cachedSelection: Record<string, unknown> | undefined;

export const resolveMerchantSelection = async (
  client: ApiClient,
): Promise<Record<string, unknown>> => {
  if (cachedSelection !== undefined) {
    return cachedSelection;
  }

  for (const extras of CANDIDATE_EXTRAS) {
    const selection = { ...BASE_SELECTION, ...extras };

    try {
      await executeWithRetry<{ merchants: Connection<MerchantRow> }>(() =>
        client.query({
          merchants: {
            __args: { first: 1 },
            edges: { node: selection },
          },
        }),
      );

      cachedSelection = selection;

      return selection;
    } catch (error) {
      // Only a schema error may narrow the selection. Falling back on a rate
      // limit or a network blip would silently drop `email` and `using` for the
      // whole run, and the job would look like it simply does not read them.
      if (!isPermanentError(error)) {
        throw error;
      }

      if (extras === CANDIDATE_EXTRAS[CANDIDATE_EXTRAS.length - 1]) {
        throw error;
      }
    }
  }

  throw new Error('No usable merchant selection');
};

export const resetMerchantSelectionCache = (): void => {
  cachedSelection = undefined;
};
