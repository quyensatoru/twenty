import { defineObject } from 'twenty-sdk/define';

import { RELATIONSHIP_STATUS_OPTIONS } from '../constants/select-options';
import {
  VIP_CLIENT_APP_USAGE_FIELD_UID,
  VIP_CLIENT_ASSIGNED_AT_FIELD_UID,
  VIP_CLIENT_AWAITING_REPLY_SINCE_FIELD_UID,
  VIP_CLIENT_LAST_BC_CONTACT_AT_FIELD_UID,
  VIP_CLIENT_LAST_BC_CONTACT_MEMBER_ID_FIELD_UID,
  VIP_CLIENT_NAME_FIELD_UID,
  VIP_CLIENT_NOTES_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PIC_ASSIGNED_BY_ID_FIELD_UID,
  VIP_CLIENT_RELATIONSHIP_STATUS_FIELD_UID,
  VIP_CLIENT_SHOP_DOMAIN_FIELD_UID,
  VIP_CLIENT_STATUS_CHANGED_AT_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  dateTimeField,
  rawJsonField,
  selectField,
  textField,
  uuidField,
} from '../utils/field-builders.util';

// One row per shop. The shop's per-app merchant rows hang off it and act as
// its app subscriptions, so the dashboard never repeats a shop per product.
export default defineObject({
  universalIdentifier: VIP_CLIENT_OBJECT_UID,
  nameSingular: 'vipClient',
  namePlural: 'vipClients',
  labelSingular: 'VIP Client',
  labelPlural: 'VIP Clients',
  description: 'A VIP shop managed by a Business Consultant',
  icon: 'IconCrown',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: VIP_CLIENT_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: VIP_CLIENT_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      icon: 'IconBuildingStore',
      isSearchable: true,
    }),
    {
      ...textField({
        universalIdentifier: VIP_CLIENT_SHOP_DOMAIN_FIELD_UID,
        name: 'shopDomain',
        label: 'Shopify domain',
        icon: 'IconWorld',
        isSearchable: true,
      }),
      isUnique: true,
    },
    selectField({
      universalIdentifier: VIP_CLIENT_RELATIONSHIP_STATUS_FIELD_UID,
      name: 'relationshipStatus',
      label: 'Client status',
      description:
        'Overall relationship status, recomputed from open issues, subscriptions and pending replies',
      icon: 'IconHeartHandshake',
      options: RELATIONSHIP_STATUS_OPTIONS,
      defaultValue: 'ACTIVE',
    }),
    dateTimeField({
      universalIdentifier: VIP_CLIENT_STATUS_CHANGED_AT_FIELD_UID,
      name: 'statusChangedAt',
      label: 'Status changed at',
      icon: 'IconClock',
    }),
    dateTimeField({
      universalIdentifier: VIP_CLIENT_LAST_BC_CONTACT_AT_FIELD_UID,
      name: 'lastBcContactAt',
      label: 'Last BC contact',
      icon: 'IconMessageCircle',
    }),
    uuidField({
      universalIdentifier: VIP_CLIENT_LAST_BC_CONTACT_MEMBER_ID_FIELD_UID,
      name: 'lastBcContactMemberId',
      label: 'Last BC contact by',
      icon: 'IconUser',
    }),
    dateTimeField({
      universalIdentifier: VIP_CLIENT_AWAITING_REPLY_SINCE_FIELD_UID,
      name: 'awaitingReplySince',
      label: 'Awaiting reply since',
      description:
        'Time of the BC outbound message the client has not answered yet',
      icon: 'IconHourglass',
    }),
    dateTimeField({
      universalIdentifier: VIP_CLIENT_ASSIGNED_AT_FIELD_UID,
      name: 'assignedAt',
      label: 'Assigned at',
      icon: 'IconUserCheck',
    }),
    textField({
      universalIdentifier: VIP_CLIENT_NOTES_FIELD_UID,
      name: 'notes',
      label: 'Notes',
      icon: 'IconNotes',
    }),
    uuidField({
      universalIdentifier: VIP_CLIENT_PIC_ASSIGNED_BY_ID_FIELD_UID,
      name: 'picAssignedById',
      label: 'PIC assigned by',
      description: 'Member who made the last PIC change, for the assignment audit',
      icon: 'IconUser',
    }),
    rawJsonField({
      universalIdentifier: VIP_CLIENT_APP_USAGE_FIELD_UID,
      name: 'appUsage',
      label: 'App usage',
      description:
        'Latest plan usage per app: { BLOY: { used, limit, cycle, plan, at } }',
      icon: 'IconGauge',
    }),
  ],
});
