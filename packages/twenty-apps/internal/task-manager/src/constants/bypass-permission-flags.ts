// Permission flags that stand in for the fork's raw `canXAllObjectRecords`
// role flags, which an app cannot read. A member holding workspace-settings
// access is the population the fork's bypass was written for; anyone else
// stays inside their appAccess grants.
export const BYPASS_PERMISSION_FLAGS = ['WORKSPACE', 'ROLES'] as const;
