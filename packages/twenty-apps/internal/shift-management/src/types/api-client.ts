import { type CoreApiClient } from 'twenty-client-sdk/core';

// The generated core client is typed `any` until `twenty dev` regenerates the
// workspace schema, so every call site goes through this alias instead of
// spreading `any` around.
export type ApiClient = CoreApiClient;
