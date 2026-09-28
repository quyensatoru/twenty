import { t } from 'twenty-sdk/front-component';

import { readErrorMessage } from '../../utils/read-error-message.util';

// Server messages are plain English strings; the catalog carries the static
// ones, so they show translated and anything else falls back to the original.
export const readErrorText = (error: unknown): string =>
  t(readErrorMessage(error) || 'Something went wrong.');
