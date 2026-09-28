import {
  type AppScopeGrantsByAppId,
  type AppScopeOperation,
} from '../types/app-scope-operation';
import { parseAppAccessPermissions } from './parse-app-access-permissions.util';

type AppAccessRow = {
  appId?: string | null;
  permissions?: readonly unknown[] | null;
};

// A member can hold more than one grant on the same app (one per appAccess
// row); the union of their permissions is what counts, matching the fork's
// cache builder.
export const buildGrantsByAppId = (
  appAccessRows: readonly AppAccessRow[],
): AppScopeGrantsByAppId => {
  const grantsByAppId: AppScopeGrantsByAppId = {};

  for (const row of appAccessRows) {
    const appId = row.appId;

    if (typeof appId !== 'string' || appId.length === 0) {
      continue;
    }

    const existing: AppScopeOperation[] = grantsByAppId[appId] ?? [];

    for (const operation of parseAppAccessPermissions(row.permissions)) {
      if (!existing.includes(operation)) {
        existing.push(operation);
      }
    }

    grantsByAppId[appId] = existing;
  }

  return grantsByAppId;
};
