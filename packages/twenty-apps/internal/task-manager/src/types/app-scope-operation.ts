// The four permission axes a workspace member can be granted on an `app`, via
// `appAccess` records. Lowercase here to match the `operation` values the
// app-scope guards take; the `appAccess.permissions` MULTI_SELECT field itself
// stores the uppercase option values (READ/WRITE/SOFT_DELETE/DESTROY).
export type AppScopeOperation = 'read' | 'write' | 'softDelete' | 'destroy';

// appId -> permissions the caller holds on that app.
export type AppScopeGrantsByAppId = Record<string, AppScopeOperation[]>;
