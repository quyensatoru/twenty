import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_ACTIVITY_OBJECT_UID,
  BC_ACTIVITY_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_ACTIVITIES_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_ACTIVITIES_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'activities',
  label: 'Activity timeline',
  description: 'Timeline of the client',
  icon: 'IconTimeline',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_ACTIVITY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_ACTIVITY_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
