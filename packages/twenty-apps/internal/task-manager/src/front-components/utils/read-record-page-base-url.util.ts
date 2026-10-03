import { RestApiClient } from 'twenty-client-sdk/rest';
import { getApplicationVariable } from 'twenty-sdk/front-component';

import { RECORD_PAGE_BASE_URL_VARIABLE } from '../../constants/application-variables';

// The sandbox has an opaque origin, so the workspace URL comes from the
// RECORD_PAGE_BASE_URL variable when it is set. Left empty, the API origin is
// the next best answer: a self-hosted server serves the front end from the
// same origin, and a bare path pasted into a chat is not a link at all.
export const readRecordPageBaseUrl = (): string | undefined => {
  const configuredBaseUrl = getApplicationVariable(
    RECORD_PAGE_BASE_URL_VARIABLE,
  );

  if (typeof configuredBaseUrl === 'string' && configuredBaseUrl.trim() !== '') {
    return configuredBaseUrl;
  }

  try {
    return new URL(new RestApiClient().resolveUrl('/')).origin;
  } catch {
    return undefined;
  }
};
