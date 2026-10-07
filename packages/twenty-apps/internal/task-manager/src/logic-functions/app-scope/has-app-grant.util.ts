import { type AppScopeOperation } from '../../types/app-scope-operation';
import { type CallerScope } from '../../types/caller-scope';
import { listGrantedAppIds } from '../../utils/list-granted-app-ids.util';

// Whether the caller holds `operation` on an app, by the rule the write guards
// enforce. For the routes that tell a panel which controls to offer: the
// answer only hides controls, the guards still decide every write.
//
// A record with no app (an issue with no project) is treated as denied, as
// every guard treats it — unless the caller bypasses app-scope.
export const hasAppGrant = (
  scope: CallerScope,
  appId: string | null,
  operation: AppScopeOperation,
): boolean =>
  scope.canBypassAppScope ||
  (appId !== null &&
    listGrantedAppIds(scope.grantsByAppId, operation).includes(appId));
