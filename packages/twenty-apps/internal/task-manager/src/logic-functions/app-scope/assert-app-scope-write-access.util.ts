import { APP_SCOPE_PATH_BY_OBJECT } from '../../constants/app-scope-paths';
import { type ApiClient } from '../../types/api-client';
import { type CallerScope } from '../../types/caller-scope';
import { AppScopePermissionDeniedError } from './app-scope-error';
import { resolveEffectiveAppId } from './resolve-effective-app-id.util';

// Write-guard for CREATE and for foreign-key reassignment on UPDATE: the
// resolved effective app of the record being written must be one the caller
// holds `write` on. Port of the fork's assertAppScopeWriteAccessOrThrow, which
// ran as a pre-query hook on project/issue/sprint/epic/issueComment/worklog.
export const assertAppScopeWriteAccess = async ({
  client,
  scope,
  objectNameSingular,
  foreignKeyValue,
}: {
  client: ApiClient;
  scope: CallerScope;
  objectNameSingular: string;
  foreignKeyValue: string | null | undefined;
}): Promise<void> => {
  if (foreignKeyValue === null || foreignKeyValue === undefined) {
    return;
  }

  if (scope.canBypassAppScope) {
    return;
  }

  const scopePath = APP_SCOPE_PATH_BY_OBJECT[objectNameSingular];

  // Not a scoped object, or `app` itself — which has no foreign key to
  // reassign and so never reaches this guard.
  if (scopePath === null || scopePath === undefined || scopePath === 'IS_APP_ITSELF') {
    return;
  }

  const effectiveAppId = await resolveEffectiveAppId({
    client,
    objectNameSingular,
    immediateForeignKeyValue: foreignKeyValue,
  });

  const grantedPermissions =
    effectiveAppId === null ? undefined : scope.grantsByAppId[effectiveAppId];

  if (grantedPermissions?.includes('write') !== true) {
    throw new AppScopePermissionDeniedError();
  }
};
