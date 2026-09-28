import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_TEMPLATES_VIEW_UID,
  CAMPAIGNS_ON_TEMPLATE_FIELD_UID,
  EMAIL_TEMPLATE_NAME_FIELD_UID,
  EMAIL_TEMPLATE_OBJECT_UID,
  EMAIL_TEMPLATE_PREVIEW_TEXT_FIELD_UID,
  EMAIL_TEMPLATE_SUBJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_TEMPLATES_VIEW_UID,
  name: 'Templates',
  objectUniversalIdentifier: EMAIL_TEMPLATE_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconTemplate',
  position: 0,
  fields: [
    {
      universalIdentifier: '4cfe683b-1cb0-4563-a06a-1a380e899251',
      fieldMetadataUniversalIdentifier: EMAIL_TEMPLATE_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: '59645521-83fb-48f9-a5b0-f8af34508c3d',
      fieldMetadataUniversalIdentifier: EMAIL_TEMPLATE_SUBJECT_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: '540abcc2-f27c-4603-aff7-63a6d194d0fa',
      fieldMetadataUniversalIdentifier: EMAIL_TEMPLATE_PREVIEW_TEXT_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 320,
    },
    {
      universalIdentifier: '0ec9b133-be9d-4c15-aa10-3a185208adbb',
      fieldMetadataUniversalIdentifier: CAMPAIGNS_ON_TEMPLATE_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 200,
    },
  ],
});
