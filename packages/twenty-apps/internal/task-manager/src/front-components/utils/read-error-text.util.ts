import { t } from 'twenty-sdk/front-component';

import { APP_SCOPE_PERMISSION_DENIED } from '../../constants/app-scope-permission-denied';

export const readErrorText = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message === APP_SCOPE_PERMISSION_DENIED
      ? t('You do not have permission to make this change.')
      : error.message;
  }

  return typeof error === 'string' ? error : 'Unexpected error';
};
