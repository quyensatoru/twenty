import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { WORKSPACE_MEMBER_SCOPED_APP_IDS_FIELD_UID } from '../constants/universal-identifiers';

// The apps this member may see, as raw ids. A row-level predicate resolves its
// value from a field on the CALLER's own workspaceMember row
// (resolve-workspace-member-predicate-value.util.ts in twenty-server), and of
// the field types it can read, only ARRAY holds several ids without pinning
// them to static options in this manifest: a one-to-many like `appAccesses`
// resolves to null there, and MULTI_SELECT would need every app id declared as
// an option before the app exists.
//
// Mirror of the appAccess rows, written by sync-app-scope-mirror. Empty or
// unset is not "unrestricted": the engine turns an unresolvable member-bound
// predicate into a filter that matches nothing.
export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_SCOPED_APP_IDS_FIELD_UID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.ARRAY,
  name: 'scopedAppIds',
  label: 'Scoped app ids',
  description: 'Apps this member holds a read grant on, mirrored from App Access',
  icon: 'IconLock',
  isNullable: true,
});
