import { type ApiClient } from '../../types/api-client';
import { type AppScopeOperation } from '../../types/app-scope-operation';
import { type CallerScope } from '../../types/caller-scope';
import { AppScopePermissionDeniedError } from './app-scope-error';
import { resolveRecordAppId } from './resolve-record-app-id.util';

// Single-record read/act guard. The list path collapses the chain once with
// listVisibleProjectIds; here resolving one chain is cheaper than enumerating
// every visible project.
export const assertRecordInScope = async ({
  client,
  scope,
  objectNameSingular,
  recordId,
  operation,
}: {
  client: ApiClient;
  scope: CallerScope;
  objectNameSingular: string;
  recordId: string | null | undefined;
  operation: AppScopeOperation;
}): Promise<void> => {
  if (scope.canBypassAppScope) {
    return;
  }

  if (recordId === null || recordId === undefined) {
    throw new AppScopePermissionDeniedError();
  }

  const appId = await resolveRecordAppId({
    client,
    objectNameSingular,
    recordId,
  });

  if (appId === null || scope.grantsByAppId[appId]?.includes(operation) !== true) {
    throw new AppScopePermissionDeniedError();
  }
};
