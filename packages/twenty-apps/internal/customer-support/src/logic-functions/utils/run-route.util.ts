import { type ApiClient } from '../../types/api-client';
import { createAppClient } from './create-app-client.util';
import { readErrorMessage } from './read-error-message.util';

export type RouteResult =
  | ({ success: true } & Record<string, unknown>)
  | { success: false; error: string };

// Routes answer 200 with `success: false` for a failure, so the inbox shows the
// reason instead of a bare 500.
export const runRoute = async (
  run: (client: ApiClient) => Promise<Record<string, unknown>>,
): Promise<RouteResult> => {
  try {
    return { success: true, ...(await run(createAppClient())) };
  } catch (error) {
    return { success: false, error: readErrorMessage(error) };
  }
};
