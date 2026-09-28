import { CoreApiClient } from 'twenty-client-sdk/core';

import { type ApiClient } from '../../types/api-client';

export const getCoreClient = (): ApiClient => new CoreApiClient();
