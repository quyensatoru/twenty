import { APP_SCOPE_PERMISSION_DENIED } from '../../constants/app-scope-permission-denied';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { resolveCallerScope } from '../app-scope/resolve-caller-scope.util';
import { isAppScopePermissionDeniedError } from '../app-scope/app-scope-error';
import { createAppClient } from './create-app-client.util';
import { readErrorMessage } from './read-error-message.util';

export type ScopedRouteResult =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; error: string };

// Every route body runs through here: one client, one resolved caller scope,
// and a single place that turns a denied guard into a `success: false` body
// rather than an unhandled 500.
export const runScopedRoute = async (
  run: (context: {
    client: ApiClient;
    scope: CallerScope;
  }) => Promise<Record<string, unknown>>,
): Promise<ScopedRouteResult> => {
  try {
    const client = createAppClient();
    const scope = await resolveCallerScope(client);
    const payload = await run({ client, scope });

    return { success: true, ...payload };
  } catch (error) {
    if (isAppScopePermissionDeniedError(error)) {
      return { success: false, error: APP_SCOPE_PERMISSION_DENIED };
    }

    return { success: false, error: readErrorMessage(error) };
  }
};
