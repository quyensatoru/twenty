import { type AppScopeGrantsByAppId } from './app-scope-operation';

export type CallerScope = {
  // null for a machine caller (application or API-key token): there is no
  // workspace member behind the request.
  workspaceMemberId: string | null;
  grantsByAppId: AppScopeGrantsByAppId;
  // When true every app-scope check short-circuits and the caller sees and
  // writes everything, subject only to their Twenty role permissions.
  canBypassAppScope: boolean;
};
