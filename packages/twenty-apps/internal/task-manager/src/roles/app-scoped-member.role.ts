import {
  defineRole,
  RowLevelPermissionPredicateOperand,
} from 'twenty-sdk/define';

import {
  APP_SCOPED_MEMBER_ROLE_UID,
  DEVELOPMENT_LINK_APP_FIELD_UID,
  DEVELOPMENT_LINK_APP_SCOPE_PREDICATE_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
  DEVELOPMENT_DELIVERY_OBJECT_UID,
  DEVELOPMENT_DELIVERY_APP_FIELD_UID,
  DEVELOPMENT_DELIVERY_APP_SCOPE_PREDICATE_UID,
  EPIC_APP_FIELD_UID,
  EPIC_APP_SCOPE_PREDICATE_UID,
  EPIC_OBJECT_UID,
  ISSUE_APP_FIELD_UID,
  ISSUE_APP_SCOPE_PREDICATE_UID,
  ISSUE_COMMENT_APP_FIELD_UID,
  ISSUE_COMMENT_APP_SCOPE_PREDICATE_UID,
  ISSUE_COMMENT_OBJECT_UID,
  ISSUE_HISTORY_APP_FIELD_UID,
  ISSUE_HISTORY_APP_SCOPE_PREDICATE_UID,
  ISSUE_HISTORY_OBJECT_UID,
  ISSUE_MERCHANT_APP_FIELD_UID,
  ISSUE_MERCHANT_APP_SCOPE_PREDICATE_UID,
  ISSUE_MERCHANT_OBJECT_UID,
  ISSUE_OBJECT_UID,
  ISSUE_STATUS_APP_FIELD_UID,
  ISSUE_STATUS_APP_SCOPE_PREDICATE_UID,
  ISSUE_STATUS_OBJECT_UID,
  MERCHANT_APP_FIELD_UID,
  MERCHANT_APP_SCOPE_PREDICATE_UID,
  MERCHANT_OBJECT_UID,
  PROJECT_APP_FIELD_UID,
  PROJECT_APP_SCOPE_PREDICATE_UID,
  PROJECT_OBJECT_UID,
  REPOSITORY_APP_FIELD_UID,
  REPOSITORY_APP_SCOPE_PREDICATE_UID,
  REPOSITORY_OBJECT_UID,
  SPRINT_APP_FIELD_UID,
  SPRINT_APP_SCOPE_PREDICATE_UID,
  SPRINT_OBJECT_UID,
  WORKLOG_APP_FIELD_UID,
  WORKLOG_APP_SCOPE_PREDICATE_UID,
  WORKLOG_OBJECT_UID,
  WORKSPACE_MEMBER_SCOPED_APP_IDS_FIELD_UID,
} from '../constants/universal-identifiers';

// A role for PEOPLE, not for the app, carrying app-scope as row-level
// predicates instead of leaving it to the routes.
//
// Each predicate resolves its value from the caller's own workspaceMember row
// and compiles to `"appId" IN (that member's scopedAppIds)` inside the ORM
// repository, so it applies to every read path — the record table, Twenty's
// Kanban, a raw GraphQL query — and to write validation. That is the coverage
// the fork had and the routes cannot reach.
//
// Three things to know before trusting it:
//   - A role with no predicate contributes no filter, and role filters are
//     ANDed, so holding another role alongside this one does not widen
//     anything.
//   - A member whose `scopedAppIds` is unset matches nothing at all, rather
//     than everything. Fail-closed is the engine's behaviour, not ours.
//   - Writes are validated the same way, so a record cannot be created
//     without an `app` the member holds. Twenty's own table creates an empty
//     row first, which is why a view a member creates from has to carry an
//     App filter: the new row is seeded from the active filters
//     (buildRecordInputFromFilter in twenty-front).
//
// `project` is read-only here on purpose: a project carries the app itself,
// and seeding one belongs with whoever administers apps.
//
// `issueHistory` is written by triggers, never by members, but it still needs
// the scoped write here: without an objectPermission row the predicate alone
// decides nothing and the feed goes blank.
const scopedWrite = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: true,
  canDestroyObjectRecords: false,
};

const buildAppScopePredicate = ({
  universalIdentifier,
  objectUniversalIdentifier,
  fieldUniversalIdentifier,
}: {
  universalIdentifier: string;
  objectUniversalIdentifier: string;
  fieldUniversalIdentifier: string;
}) => ({
  universalIdentifier,
  objectUniversalIdentifier,
  fieldUniversalIdentifier,
  operand: RowLevelPermissionPredicateOperand.IS,
  workspaceMemberFieldUniversalIdentifier:
    WORKSPACE_MEMBER_SCOPED_APP_IDS_FIELD_UID,
});

export default defineRole({
  universalIdentifier: APP_SCOPED_MEMBER_ROLE_UID,
  label: 'Task Manager member',
  description:
    'Task manager access limited to the apps the member holds a grant on',
  icon: 'IconLock',
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  canUpdateAllSettings: false,
  // Shaped like the standard `Member` role, because a workspace member holds
  // exactly one role: anything this role does not grant, the person loses.
  // Reading everything else and writing nothing else is what `Member` gives
  // them today; the permissions below and the predicates are the delta.
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  objectPermissions: [
    { objectUniversalIdentifier: ISSUE_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: SPRINT_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: EPIC_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: WORKLOG_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: REPOSITORY_OBJECT_UID, ...scopedWrite },
    { objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID, ...scopedWrite },
    {
      objectUniversalIdentifier: DEVELOPMENT_DELIVERY_OBJECT_UID,
      canReadObjectRecords: true,
      canUpdateObjectRecords: false,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  rowLevelPermissionPredicates: [
    buildAppScopePredicate({
      universalIdentifier: DEVELOPMENT_DELIVERY_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: DEVELOPMENT_DELIVERY_OBJECT_UID,
      fieldUniversalIdentifier: DEVELOPMENT_DELIVERY_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: ISSUE_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: ISSUE_OBJECT_UID,
      fieldUniversalIdentifier: ISSUE_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: PROJECT_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: PROJECT_OBJECT_UID,
      fieldUniversalIdentifier: PROJECT_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: SPRINT_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: SPRINT_OBJECT_UID,
      fieldUniversalIdentifier: SPRINT_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: EPIC_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: EPIC_OBJECT_UID,
      fieldUniversalIdentifier: EPIC_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: ISSUE_STATUS_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: ISSUE_STATUS_OBJECT_UID,
      fieldUniversalIdentifier: ISSUE_STATUS_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: ISSUE_COMMENT_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: ISSUE_COMMENT_OBJECT_UID,
      fieldUniversalIdentifier: ISSUE_COMMENT_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: WORKLOG_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: WORKLOG_OBJECT_UID,
      fieldUniversalIdentifier: WORKLOG_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: ISSUE_MERCHANT_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: ISSUE_MERCHANT_OBJECT_UID,
      fieldUniversalIdentifier: ISSUE_MERCHANT_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: ISSUE_HISTORY_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: ISSUE_HISTORY_OBJECT_UID,
      fieldUniversalIdentifier: ISSUE_HISTORY_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: REPOSITORY_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
      fieldUniversalIdentifier: REPOSITORY_APP_FIELD_UID,
    }),
    buildAppScopePredicate({
      universalIdentifier: DEVELOPMENT_LINK_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
      fieldUniversalIdentifier: DEVELOPMENT_LINK_APP_FIELD_UID,
    }),
    // `merchant` and its `app` field both belong to customer-support. A
    // predicate names them by identifier, and validation runs over the whole
    // workspace graph, so scoping another application's object from here is
    // the same cross-boundary reference `merchant.issues` already is.
    buildAppScopePredicate({
      universalIdentifier: MERCHANT_APP_SCOPE_PREDICATE_UID,
      objectUniversalIdentifier: MERCHANT_OBJECT_UID,
      fieldUniversalIdentifier: MERCHANT_APP_FIELD_UID,
    }),
  ],
});
