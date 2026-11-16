import { type ApiClient } from '../../types/api-client';
import { type BcScope } from '../../types/bc-scope';
import { createAppClient } from './create-app-client.util';
import { readErrorMessage } from './read-error-message.util';
import { resolveBcScope } from './resolve-bc-scope.util';

export type BcRouteResult =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; error: string };

// Business errors come back as `success: false` with an English message the
// page translates and shows, rather than as a bare 500.
export const runBcRoute = async (
  run: (context: {
    client: ApiClient;
    scope: BcScope;
  }) => Promise<Record<string, unknown>>,
): Promise<BcRouteResult> => {
  try {
    const client = createAppClient();
    const scope = await resolveBcScope(client);

    return { success: true, ...(await run({ client, scope })) };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};
