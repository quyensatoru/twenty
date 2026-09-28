import { type AppScopeOperation } from '../types/app-scope-operation';

const OPERATION_BY_OPTION_VALUE: Record<string, AppScopeOperation> = {
  READ: 'read',
  WRITE: 'write',
  SOFT_DELETE: 'softDelete',
  DESTROY: 'destroy',
};

// `appAccess.permissions` stores the uppercase MULTI_SELECT option values; the
// guards work in the lowercase operation vocabulary.
export const parseAppAccessPermissions = (
  permissions: readonly unknown[] | null | undefined,
): AppScopeOperation[] => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  const operations: AppScopeOperation[] = [];

  for (const permission of permissions) {
    if (typeof permission !== 'string') {
      continue;
    }

    const operation = OPERATION_BY_OPTION_VALUE[permission];

    if (operation !== undefined && !operations.includes(operation)) {
      operations.push(operation);
    }
  }

  return operations;
};
