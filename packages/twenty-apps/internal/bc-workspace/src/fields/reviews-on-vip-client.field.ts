import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_REVIEW_OBJECT_UID,
  BC_REVIEW_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_REVIEWS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_REVIEWS_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'reviews',
  label: 'App reviews',
  description: 'Reviews left by the client',
  icon: 'IconStar',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_REVIEW_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_REVIEW_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
