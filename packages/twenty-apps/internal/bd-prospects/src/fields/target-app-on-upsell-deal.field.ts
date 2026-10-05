import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  APP_OBJECT_UID,
  TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
  UPSELL_DEAL_OBJECT_UID,
  UPSELL_DEALS_ON_APP_FIELD_UID,
} from '../constants/universal-identifiers';

// Picked from the `app` registry instead of typed, so a deal can never point
// at an app that does not exist.
//
// The cost, and it is not small: a MANY_TO_ONE edge to `app` enrols this object
// in the workspace's app-scope enforcement. For a role without
// `canReadAllObjectRecords`, deals are filtered to the apps the member holds an
// `appAccess` grant on, and creating a deal whose target app is empty is
// refused outright (validate-app-scope-for-records.util.ts fails closed on a
// null app FK). Changing a stage is unaffected: an update that does not touch
// the app column skips the check.
export default defineField({
  universalIdentifier: TARGET_APP_ON_UPSELL_DEAL_FIELD_UID,
  objectUniversalIdentifier: UPSELL_DEAL_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'targetApp',
  label: 'Target app',
  description: 'App this deal tries to sell, from the app registry',
  icon: 'IconApps',
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: UPSELL_DEALS_ON_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'targetAppId',
  },
});
