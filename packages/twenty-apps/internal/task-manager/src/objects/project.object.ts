import { defineObject, FieldType } from 'twenty-sdk/define';

import { PROJECT_CATEGORY_OPTIONS } from '../constants/project-category-options';
import {
  PROJECT_CATEGORY_FIELD_UID,
  PROJECT_DESCRIPTION_FIELD_UID,
  PROJECT_KEY_FIELD_UID,
  PROJECT_NAME_FIELD_UID,
  PROJECT_NEXT_ISSUE_NUMBER_FIELD_UID,
  PROJECT_OBJECT_UID,
} from '../constants/universal-identifiers';

// `project` is the app-scope root: its own `appId` IS the effective app, and
// issues, sprints, epics, statuses, comments and worklogs all inherit through
// it.
export default defineObject({
  universalIdentifier: PROJECT_OBJECT_UID,
  nameSingular: 'project',
  namePlural: 'projects',
  labelSingular: 'Project',
  labelPlural: 'Projects',
  description: 'A project',
  icon: 'IconListDetails',
  labelIdentifierFieldMetadataUniversalIdentifier: PROJECT_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: PROJECT_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Project name',
      icon: 'IconListDetails',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_KEY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'key',
      label: 'Key',
      description: 'Project key, used as the issue key prefix',
      icon: 'IconKey',
      isNullable: true,
      isUnique: true,
    },
    {
      universalIdentifier: PROJECT_NEXT_ISSUE_NUMBER_FIELD_UID,
      type: FieldType.NUMBER,
      name: 'nextIssueNumber',
      label: 'Next issue number',
      description:
        'Counter used to generate the next issue key for this project',
      icon: 'IconHash',
      isUIEditable: false,
      defaultValue: 1,
    },
    {
      universalIdentifier: PROJECT_DESCRIPTION_FIELD_UID,
      type: FieldType.RICH_TEXT,
      name: 'description',
      label: 'Description',
      description: 'Project description',
      icon: 'IconFilePencil',
      isNullable: true,
    },
    {
      universalIdentifier: PROJECT_CATEGORY_FIELD_UID,
      type: FieldType.SELECT,
      name: 'category',
      label: 'Category',
      description: 'Project category',
      icon: 'IconCategory',
      isNullable: true,
      defaultValue: "'SOFTWARE'",
      options: [...PROJECT_CATEGORY_OPTIONS],
    },
  ],
});
