import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  SPRINT_PROJECT_FIELD_UID,
  SPRINT_OBJECT_UID,
  PROJECT_OBJECT_UID,
  PROJECT_SPRINTS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: SPRINT_PROJECT_FIELD_UID,
  objectUniversalIdentifier: SPRINT_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'project',
  label: "Project",
  description: "Sprint's project",
  icon: 'IconListDetails',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_SPRINTS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'projectId',
  },
});
