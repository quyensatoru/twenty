import { CoreApiClient } from 'twenty-client-sdk/core';

export type AppClient = {
  query: (selection: Record<string, unknown>) => Promise<unknown>;
};

// The share routes are public: there is no member token to act with, so they
// read through the application role, which can only read. The generated client
// only knows this app's objects after a schema sync, so it is used untyped.
export const createAppClient = (): AppClient =>
  new CoreApiClient({ runAs: 'application' }) as unknown as AppClient;
