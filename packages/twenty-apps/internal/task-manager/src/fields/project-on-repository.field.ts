import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  PROJECT_OBJECT_UID,
  PROJECT_REPOSITORIES_FIELD_UID,
  REPOSITORY_OBJECT_UID,
  REPOSITORY_PROJECT_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: REPOSITORY_PROJECT_FIELD_UID,
  objectUniversalIdentifier: REPOSITORY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'project',
  label: 'Project',
  description: "Repository's project",
  icon: 'IconListDetails',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    PROJECT_REPOSITORIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'projectId',
  },
});
