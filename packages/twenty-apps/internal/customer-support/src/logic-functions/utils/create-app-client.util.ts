import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ApiClient } from '../../types/api-client';

// Routes run on behalf of a signed-in member, but the inbox reads and the sync
// writes are the app's own work, scoped by its runtime role.
export const createAppClient = (): ApiClient =>
  new CoreApiClient({ runAs: 'application' });
