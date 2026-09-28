import {
  type AppScopeGrantsByAppId,
  type AppScopeOperation,
} from '../types/app-scope-operation';

export const listGrantedAppIds = (
  grantsByAppId: AppScopeGrantsByAppId,
  operation: AppScopeOperation,
): string[] =>
  Object.entries(grantsByAppId)
    .filter(([, permissions]) => permissions.includes(operation))
    .map(([appId]) => appId);
