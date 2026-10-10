import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import { DEVELOPMENT_LINK_TYPE_OPTIONS } from '../constants/development-link-type-options';
import {
  DEVELOPMENT_LINK_AUTHOR_NAME_FIELD_UID,
  DEVELOPMENT_LINK_EXTERNAL_ID_FIELD_UID,
  DEVELOPMENT_LINK_OBJECT_UID,
  DEVELOPMENT_LINK_STATUS_FIELD_UID,
  DEVELOPMENT_LINK_TITLE_FIELD_UID,
  DEVELOPMENT_LINK_TYPE_FIELD_UID,
  DEVELOPMENT_LINK_URL_FIELD_UID,
} from '../constants/universal-identifiers';

// One row of an issue's Development panel, Jira-style: a branch, a commit or
// a pull request mentioning the issue key. Written by hand through the widget
// or attached automatically by the public git webhook; the widget groups by
// type and the webhook dedupes on (issue, type, externalId).
export default defineObject({
  universalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
  nameSingular: 'developmentLink',
  namePlural: 'developmentLinks',
  labelSingular: 'Development Link',
  labelPlural: 'Development Links',
  description: "An issue's linked branch, commit or pull request",
  icon: 'IconGitCommit',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: DEVELOPMENT_LINK_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: DEVELOPMENT_LINK_TYPE_FIELD_UID,
      type: FieldType.SELECT,
      name: 'linkType',
      label: 'Type',
      description: 'Branch, commit or pull request',
      icon: 'IconGitBranch',
      isNullable: true,
      defaultValue: "'BRANCH'",
      options: [...DEVELOPMENT_LINK_TYPE_OPTIONS],
    },
    {
      universalIdentifier: DEVELOPMENT_LINK_TITLE_FIELD_UID,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Title',
      description: 'Branch name, commit message or pull request title',
      icon: 'IconNotes',
      isNullable: true,
      isSearchable: true,
    },
    {
      universalIdentifier: DEVELOPMENT_LINK_URL_FIELD_UID,
      type: FieldType.TEXT,
      name: 'url',
      label: 'URL',
      description: 'Link to the branch, commit or pull request',
      icon: 'IconLink',
      isNullable: true,
    },
    {
      universalIdentifier: DEVELOPMENT_LINK_STATUS_FIELD_UID,
      type: FieldType.TEXT,
      name: 'status',
      label: 'Status',
      description: 'OPEN, MERGED, CLOSED, … as reported by the provider',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier: DEVELOPMENT_LINK_EXTERNAL_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'externalId',
      label: 'External id',
      description: 'Branch name, commit sha or provider MR number',
      icon: 'IconHash',
      isNullable: true,
      isSearchable: true,
    },
    {
      universalIdentifier: DEVELOPMENT_LINK_AUTHOR_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'authorName',
      label: 'Author name',
      description: 'Who pushed the branch, commit or pull request',
      icon: 'IconUser',
      isNullable: true,
    },
  ],
});
