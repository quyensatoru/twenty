import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_SHIFT_TEMPLATES_VIEW_CODE_FIELD_UID,
  ALL_SHIFT_TEMPLATES_VIEW_DAY_KIND_FIELD_UID,
  ALL_SHIFT_TEMPLATES_VIEW_END_TIME_FIELD_UID,
  ALL_SHIFT_TEMPLATES_VIEW_IS_ACTIVE_FIELD_UID,
  ALL_SHIFT_TEMPLATES_VIEW_NAME_FIELD_UID,
  ALL_SHIFT_TEMPLATES_VIEW_START_TIME_FIELD_UID,
  ALL_SHIFT_TEMPLATES_VIEW_UID,
  SHIFT_TEMPLATE_CODE_FIELD_UID,
  SHIFT_TEMPLATE_DAY_KIND_FIELD_UID,
  SHIFT_TEMPLATE_END_TIME_FIELD_UID,
  SHIFT_TEMPLATE_IS_ACTIVE_FIELD_UID,
  SHIFT_TEMPLATE_NAME_FIELD_UID,
  SHIFT_TEMPLATE_OBJECT_UID,
  SHIFT_TEMPLATE_START_TIME_FIELD_UID,
} from '../constants/universal-identifiers';

// salaryPerHour is deliberately absent: the catalog is team-visible and pay is
// only shown to a member through their own report.
export default defineView({
  universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_UID,
  name: 'All Shift Templates',
  objectUniversalIdentifier: SHIFT_TEMPLATE_OBJECT_UID,
  type: ViewType.TABLE,
  icon: 'IconClockCog',
  position: 0,
  fields: [
    {
      universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_NAME_FIELD_UID,
      fieldMetadataUniversalIdentifier: SHIFT_TEMPLATE_NAME_FIELD_UID,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_CODE_FIELD_UID,
      fieldMetadataUniversalIdentifier: SHIFT_TEMPLATE_CODE_FIELD_UID,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_START_TIME_FIELD_UID,
      fieldMetadataUniversalIdentifier: SHIFT_TEMPLATE_START_TIME_FIELD_UID,
      position: 2,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_END_TIME_FIELD_UID,
      fieldMetadataUniversalIdentifier: SHIFT_TEMPLATE_END_TIME_FIELD_UID,
      position: 3,
      isVisible: true,
      size: 110,
    },
    {
      universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_DAY_KIND_FIELD_UID,
      fieldMetadataUniversalIdentifier: SHIFT_TEMPLATE_DAY_KIND_FIELD_UID,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: ALL_SHIFT_TEMPLATES_VIEW_IS_ACTIVE_FIELD_UID,
      fieldMetadataUniversalIdentifier: SHIFT_TEMPLATE_IS_ACTIVE_FIELD_UID,
      position: 5,
      isVisible: true,
      size: 100,
    },
  ],
});
