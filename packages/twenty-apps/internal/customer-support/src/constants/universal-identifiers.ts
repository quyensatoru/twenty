// `merchant` already exists in every workspace this app will be installed
// into: it was a standard object of the fork, then task-manager's, and this
// app takes ownership of it. Its identity is `(workspaceId,
// universalIdentifier)`, so the value below MUST stay the one already in
// core.objectMetadata — a new value would make `apply` create a second, empty
// merchant table and leave the populated one orphaned.
export const MERCHANT_OBJECT_UID = '5d9a58bd-983c-4ca4-9f0a-b53cdec4cfca';
export const MERCHANT_NAME_FIELD_UID = 'a9bc9790-aece-4df3-b22a-6bdf26f079a1';
export const MERCHANT_CUSTOM_SETTINGS_FIELD_UID =
  '0ff00e57-a471-4cb7-baa5-f9f7b4a49418';

// `app` stays with task-manager. merchant.appId points at it across the
// application boundary, which the manifest allows: a migration's `from` set is
// filtered to the owning application, so an object another app owns is never
// in this app's diff, while validation runs over the whole workspace graph so
// the foreign key still resolves.
export const APP_OBJECT_UID = '4d71d304-ea37-457c-9422-48812659d75e';

// Everything this app owns, in one place: a duplicate or a typo silently
// creates a second entity on install instead of updating the existing one.
// Never change a value after the first sync.
export const APPLICATION_UID = '37713d9d-6058-4b15-bac2-6a8f2f234e5a';
export const APP_RUNTIME_ROLE_UID = 'b363f07a-23ff-48d0-8f54-a2909e6172be';

// Existing entities that move here with the object. Their values are the ones
// already in the workspace, so the sync updates them in place instead of
// creating duplicates alongside the originals.
export const ALL_MERCHANTS_VIEW_UID = '7e113b9b-b798-4f1a-99d5-926869ae1e28';
export const MERCHANTS_NAV_ITEM_UID = '7f0e425f-99ba-4782-ac92-23252d22cfdd';

// New: the Merchants entry used to sit in the Task Manager folder, which that
// app owns and which is the wrong place for it now.
export const CUSTOMER_SUPPORT_FOLDER_NAV_ITEM_UID =
  '8b813dd2-9ef7-48b6-86c0-14501e6bc6e8';

// The merchant <-> app relation and the index over its join column. Both move
// with the object: a manifest that declares an index must also declare the
// object it is on — `twenty plan` refuses with "Index ... references unknown
// object" otherwise. Fields carry no such rule, which is why task-manager can
// keep owning `issues` on this object.
export const MERCHANT_APP_FIELD_UID = '050c5e37-f2b2-452f-84f3-6d9396ccfbe4';
export const APP_MERCHANTS_FIELD_UID = '47a89700-ba35-4c37-84da-afca9f43bd8c';
export const MERCHANT_APP_ID_INDEX_UID =
  'dfae531a-75a7-4810-babc-b75d3f6c6b4f';
export const MERCHANT_APP_ID_INDEX_FIELD_UID =
  '2a9b93d7-9a27-4be9-bb6c-0f1d7de7c92e';
