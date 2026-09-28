import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  EMAIL_TEMPLATE_DESIGN_FIELD_UID,
  EMAIL_TEMPLATE_NAME_FIELD_UID,
  EMAIL_TEMPLATE_OBJECT_UID,
  EMAIL_TEMPLATE_PREVIEW_TEXT_FIELD_UID,
  EMAIL_TEMPLATE_SUBJECT_FIELD_UID,
} from '../constants/universal-identifiers';

// The design is stored as blocks, not HTML: the HTML is rendered from it at
// send time, so a fix to the renderer reaches every template at once.
export default defineObject({
  universalIdentifier: EMAIL_TEMPLATE_OBJECT_UID,
  nameSingular: 'emailTemplate',
  namePlural: 'emailTemplates',
  labelSingular: 'Email template',
  labelPlural: 'Email templates',
  description: 'Reusable email content built in the Email Studio editor',
  icon: 'IconTemplate',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    EMAIL_TEMPLATE_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: EMAIL_TEMPLATE_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: EMAIL_TEMPLATE_SUBJECT_FIELD_UID,
      type: FieldType.TEXT,
      name: 'subject',
      label: 'Subject',
      description: 'Supports variables such as {{storeName}}',
      icon: 'IconMail',
    },
    {
      universalIdentifier: EMAIL_TEMPLATE_PREVIEW_TEXT_FIELD_UID,
      type: FieldType.TEXT,
      name: 'previewText',
      label: 'Preview text',
      description: 'Shown after the subject in most inboxes',
      icon: 'IconEye',
    },
    {
      universalIdentifier: EMAIL_TEMPLATE_DESIGN_FIELD_UID,
      type: FieldType.RAW_JSON,
      name: 'design',
      label: 'Design',
      description: 'Blocks and styles edited in Email Studio',
      icon: 'IconLayoutList',
      isNullable: true,
    },
  ],
});
