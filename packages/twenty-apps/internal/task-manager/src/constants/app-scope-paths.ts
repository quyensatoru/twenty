// Ordered MANY_TO_ONE relation field names to traverse from each object up to
// its app-scope root (the object that holds the FK to `app`).
//   []              the object IS an app-scope root (it holds `appId` itself)
//   'IS_APP_ITSELF' the object IS `app`, scoped by comparing its own id
//   null            unscoped, governed only by ordinary role permissions
//
// This is the fixed result of the fork's breadth-first search over this app's
// object graph (build-app-scope-path-by-object-id.util.ts). The search is
// re-materialised as a table because an app cannot read field metadata at
// request time — and because the graph is closed: nothing outside this
// package can add a MANY_TO_ONE edge that would shorten a path.
//
// `appAccess` is deliberately NOT a root even though it holds an `appId`: it
// only records which app a grant is FOR. Treating it as scoped would mean a
// member had to already hold a grant on an app before being allowed to delete
// that same grant.
export const APP_SCOPE_PATH_BY_OBJECT: Record<
  string,
  string[] | null | 'IS_APP_ITSELF'
> = {
  app: 'IS_APP_ITSELF',
  appAccess: null,
  project: [],
  merchant: [],
  issue: ['project'],
  sprint: ['project'],
  epic: ['project'],
  issueStatus: ['project'],
  issueComment: ['issue', 'project'],
  worklog: ['issue', 'project'],
  issueMerchant: ['merchant'],
  repository: ['project'],
  developmentLink: ['issue', 'project'],
  developmentDelivery: ['issue', 'project'],
};

// Plural GraphQL collection name of each hop target, so a walk can fetch the
// next row without a metadata lookup.
export const PLURAL_NAME_BY_OBJECT: Record<string, string> = {
  app: 'apps',
  appAccess: 'appAccesses',
  project: 'projects',
  merchant: 'merchants',
  issue: 'issues',
  sprint: 'sprints',
  epic: 'epics',
  issueStatus: 'issueStatuses',
  issueComment: 'issueComments',
  worklog: 'worklogs',
  issueMerchant: 'issueMerchants',
  repository: 'repositories',
  developmentLink: 'developmentLinks',
  developmentDelivery: 'developmentDeliveries',
};

// Object a relation field name points at, for the objects this app scopes.
export const HOP_TARGET_BY_FIELD_NAME: Record<string, string> = {
  project: 'project',
  issue: 'issue',
  merchant: 'merchant',
  repository: 'repository',
  app: 'app',
};

// No object this app owns is "unassigned visible": a project, merchant or
// issue with no resolvable app stays hidden from every non-bypass caller
// rather than becoming visible to all of them.
export const APP_SCOPE_UNASSIGNED_VISIBLE_OBJECTS: readonly string[] = [];
