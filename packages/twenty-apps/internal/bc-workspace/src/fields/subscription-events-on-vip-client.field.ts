import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  BC_SUBSCRIPTION_EVENT_OBJECT_UID,
  BC_SUBSCRIPTION_EVENT_VIP_CLIENT_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_SUBSCRIPTION_EVENTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: VIP_CLIENT_SUBSCRIPTION_EVENTS_FIELD_UID,
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'subscriptionEvents',
  label: 'Subscription events',
  description: 'Plan changes of the client',
  icon: 'IconReceipt',
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: BC_SUBSCRIPTION_EVENT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: BC_SUBSCRIPTION_EVENT_VIP_CLIENT_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
