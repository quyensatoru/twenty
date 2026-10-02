import { defineField, FieldType } from 'twenty-sdk/define';

import { MERCHANT_CUSTOM_SETTING_FILES_MAX } from '../constants/merchant-custom-setting-files';
import {
  MERCHANT_CUSTOM_SETTING_FILES_FIELD_UID,
  MERCHANT_OBJECT_UID,
} from '../constants/universal-identifiers';

// The store behind a FILE custom setting. Nothing writes the field's own value:
// `uploadFile`/`uploadFileByHandle` take a fieldMetadataId to decide WHERE a
// file is kept, and the resulting URL is what lands in
// merchant.customSettings[key]. So the field is the folder, and the setting is
// the reference.
//
// Not issue.attachments, which is what the markdown composer uses: a merchant's
// CSV has no business showing up among an issue's attachments.
export default defineField({
  universalIdentifier: MERCHANT_CUSTOM_SETTING_FILES_FIELD_UID,
  objectUniversalIdentifier: MERCHANT_OBJECT_UID,
  type: FieldType.FILES,
  name: 'customSettingFiles',
  label: 'Custom Setting Files',
  description: 'Files uploaded for this merchant custom settings',
  icon: 'IconPaperclip',
  isNullable: true,
  // Required by the engine for a FILES field. Generous rather than tight: one
  // upload per FILE setting and per tool run, and a replaced file leaves the
  // old one behind.
  universalSettings: { maxNumberOfValues: MERCHANT_CUSTOM_SETTING_FILES_MAX },
  // The host also renders this field with its own native picker, which is a
  // second, working way to get a file in on a host that cannot hand the
  // sandbox one. Left editable for exactly that reason.
});
