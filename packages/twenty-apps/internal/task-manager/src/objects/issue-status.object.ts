import { defineObject, FieldType } from 'twenty-sdk/define';

import { ISSUE_STATUS_CATEGORY_OPTIONS } from '../constants/issue-status-category-options';
import { ISSUE_STATUS_COLOR_OPTIONS } from '../constants/issue-status-color-options';
import {
  ISSUE_STATUS_CATEGORY_FIELD_UID,
  ISSUE_STATUS_COLOR_FIELD_UID,
  ISSUE_STATUS_NAME_FIELD_UID,
  ISSUE_STATUS_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineObject({
  universalIdentifier: ISSUE_STATUS_OBJECT_UID,
  nameSingular: 'issueStatus',
  namePlural: 'issueStatuses',
  labelSingular: 'Issue status',
  labelPlural: 'Issue statuses',
  description: 'A per-project status an issue can be in',
  icon: 'IconProgressCheck',
  labelIdentifierFieldMetadataUniversalIdentifier: ISSUE_STATUS_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: ISSUE_STATUS_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Issue status name',
      icon: 'IconTag',
      isNullable: true,
    },
    {
      universalIdentifier: ISSUE_STATUS_COLOR_FIELD_UID,
      type: FieldType.SELECT,
      name: 'color',
      label: 'Color',
      description: 'Issue status color',
      icon: 'IconColorSwatch',
      isNullable: true,
      options: [...ISSUE_STATUS_COLOR_OPTIONS],
    },
    {
      universalIdentifier: ISSUE_STATUS_CATEGORY_FIELD_UID,
      type: FieldType.SELECT,
      name: 'category',
      label: 'Category',
      description:
        'Status category, used to compute progress and roadmap grouping',
      icon: 'IconProgressCheck',
      isNullable: true,
      options: [...ISSUE_STATUS_CATEGORY_OPTIONS],
    },
  ],
});
