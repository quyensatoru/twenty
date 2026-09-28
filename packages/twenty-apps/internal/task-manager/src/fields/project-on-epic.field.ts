import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  EPIC_PROJECT_FIELD_UID,
  EPIC_OBJECT_UID,
  PROJECT_OBJECT_UID,
  PROJECT_EPICS_FIELD_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: EPIC_PROJECT_FIELD_UID,
  objectUniversalIdentifier: EPIC_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'project',
  label: "Project",
  description: "Epic's project",
  icon: 'IconListDetails',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: PROJECT_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: PROJECT_EPICS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'projectId',
  },
});
