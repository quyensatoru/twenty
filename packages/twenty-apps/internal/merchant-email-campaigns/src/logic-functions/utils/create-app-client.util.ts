import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ApiClient } from '../../types/api-client';

// Routes called from the studio run with the member's delegated token by
// default, and the fork's app-scope then hides every merchant of an app the
// member has no grant on. Campaigns target the whole audience, so every read
// and write here goes through the application's own token instead. Who may
// trigger a send is checked separately with the member's token.
export const createAppClient = (): ApiClient =>
  new CoreApiClient({ runAs: 'application' });
