import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ApiClient } from '../../types/api-client';

// Every read and write goes through the application's own token. The member's
// delegated token is deliberately NOT used for data: once the workspace Member
// role loses read/write on shift (DEPLOY.md), it reaches nothing. The routes
// re-apply the per-member scoping themselves — that is the whole point of
// routing member access through them.
export const createAppClient = (): ApiClient =>
  new CoreApiClient({ runAs: 'application' });
