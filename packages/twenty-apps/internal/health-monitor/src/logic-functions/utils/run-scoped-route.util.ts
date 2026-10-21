import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { createAppClient } from './create-app-client.util';
import { readErrorMessage } from './read-error-message.util';
import { resolveCallerScope } from './resolve-caller-scope.util';

export type ScopedRouteResult =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; error: string };

// Business errors come back as `success: false` with a message the dashboard
// shows as is, rather than as a bare 500.
export const runScopedRoute = async (
  run: (context: {
    client: ApiClient;
    scope: CallerScope;
  }) => Promise<Record<string, unknown>>,
): Promise<ScopedRouteResult> => {
  try {
    const client = createAppClient();
    const scope = await resolveCallerScope(client);

    return { success: true, ...(await run({ client, scope })) };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};
