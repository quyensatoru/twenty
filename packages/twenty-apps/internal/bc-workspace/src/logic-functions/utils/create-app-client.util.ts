import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ApiClient } from '../../types/api-client';

// Crons and triggers have no caller, and routes check the caller's BC scope
// themselves, so every read and write goes through the application role.
export const createAppClient = (): ApiClient =>
  new CoreApiClient({ runAs: 'application' });
