import { MERCHANT_BASE_SELECTION } from '../../constants/merchant-base-selection';
import { MERCHANT_OPTIONAL_SELECTION } from '../../constants/merchant-optional-selection';
import { type ApiClient } from '../../types/api-client';
import { executeWithRetry } from '../../utils/execute-with-retry.util';
import { isPermanentApiError } from '../../utils/is-permanent-api-error.util';

let cachedSelection: Record<string, unknown> | undefined;

const probe = async (client: ApiClient, selection: Record<string, unknown>) => {
  try {
    await executeWithRetry(() =>
      client.query({
        merchants: { __args: { first: 1 }, edges: { node: selection } },
      }),
    );

    return true;
  } catch (error) {
    if (isPermanentApiError(error)) {
      return false;
    }

    throw error;
  }
};

// The widest selection is tried first, and only a schema error narrows it:
// dropping `using` because of a network blip would make every merchant look
// installed for the rest of the run.
export const resolveMerchantSelection = async (
  client: ApiClient,
): Promise<Record<string, unknown>> => {
  if (cachedSelection !== undefined) {
    return cachedSelection;
  }

  const widest = { ...MERCHANT_BASE_SELECTION, ...MERCHANT_OPTIONAL_SELECTION };

  if (await probe(client, widest)) {
    cachedSelection = widest;

    return widest;
  }

  const selection: Record<string, unknown> = { ...MERCHANT_BASE_SELECTION };

  for (const fieldName of Object.keys(MERCHANT_OPTIONAL_SELECTION)) {
    if (
      await probe(client, { ...MERCHANT_BASE_SELECTION, [fieldName]: true })
    ) {
      selection[fieldName] = true;
    }
  }

  cachedSelection = selection;

  return selection;
};
