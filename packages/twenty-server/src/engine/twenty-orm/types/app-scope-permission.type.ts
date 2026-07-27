// The 4 permission axes a workspace member can be granted on an `app`, via
// `appAccess` records. Lowercase here to match the `operation` values used by
// the app-scope enforcement utils; the `appAccess.permissions` MULTI_SELECT
// field itself stores the uppercase option values (READ/WRITE/SOFT_DELETE/DESTROY).
export type AppScopeOperation = 'read' | 'write' | 'softDelete' | 'destroy';

// memberId -> appId -> permissions granted to that member on that app.
// Array, not Set: this is cached through Redis (see WorkspaceCacheService),
// which round-trips values through JSON — a Set serializes to `{}` and loses
// its `.has()` method on the way back.
export type AppScopeGrantsByMemberId = Record<
  string,
  Record<string, AppScopeOperation[]>
>;

// roleId -> raw `canXAllObjectRecords` flags off RoleEntity. Distinct from the
// computed per-object ObjectsPermissions, which can't be told apart from an
// explicit narrow per-object grant (see app-scope permission plan, bypass semantics).
export type AllObjectRecordsRoleFlagsByRoleId = Record<
  string,
  Record<AppScopeOperation, boolean>
>;

// Shape stored under the `appScopeGrants` workspace cache key.
export type AppScopeGrantsCacheData = {
  grantsByMemberId: AppScopeGrantsByMemberId;
  allObjectRecordsRoleFlagsByRoleId: AllObjectRecordsRoleFlagsByRoleId;
};
