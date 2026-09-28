import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ApiClient } from '../../types/api-client';

// Every route reads and writes with the application's own token. App-scope is
// not a role concept in this app: it is enforced per route in TypeScript
// against the caller's appAccess grants, and a narrower token would leave the
// route unable to resolve the project -> app chain those checks depend on.
export const createAppClient = (): ApiClient =>
  new CoreApiClient({ runAs: 'application' });
