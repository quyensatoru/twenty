import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_VIP_CLIENTS_VIEW_UID,
  VIP_CLIENT_LAST_BC_CONTACT_AT_FIELD_UID,
  VIP_CLIENT_NAME_FIELD_UID,
  VIP_CLIENT_OBJECT_UID,
  VIP_CLIENT_PIC_FIELD_UID,
  VIP_CLIENT_RELATIONSHIP_STATUS_FIELD_UID,
  VIP_CLIENT_SHOP_DOMAIN_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_VIP_CLIENTS_VIEW_UID,
  name: 'All VIP clients',
  objectUniversalIdentifier: VIP_CLIENT_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconCrown',
  position: 0,
  fields: [
    {
      universalIdentifier: '4e5c66a5-ad05-42c4-9b21-f52983db9ca9',
      fieldMetadataUniversalIdentifier: VIP_CLIENT_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '58f0be60-d014-4590-9d94-140e6f799522',
      fieldMetadataUniversalIdentifier: VIP_CLIENT_SHOP_DOMAIN_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: 'a33e8a51-fa17-4484-bd39-fedf1faec95f',
      fieldMetadataUniversalIdentifier: VIP_CLIENT_PIC_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '26377eeb-558a-440a-930b-4d0e84e7e7a8',
      fieldMetadataUniversalIdentifier: VIP_CLIENT_RELATIONSHIP_STATUS_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '84755140-ed11-4f66-9371-81ae3f70647a',
      fieldMetadataUniversalIdentifier: VIP_CLIENT_LAST_BC_CONTACT_AT_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 170,
    },
  ],
});
