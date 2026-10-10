import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  DEVELOPMENT_DELIVERY_OBJECT_UID,
  DEVELOPMENT_DELIVERY_REPOSITORY_FIELD_UID,
  REPOSITORY_DEVELOPMENT_DELIVERIES_FIELD_UID,
  REPOSITORY_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: DEVELOPMENT_DELIVERY_REPOSITORY_FIELD_UID,
  objectUniversalIdentifier: DEVELOPMENT_DELIVERY_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'repository',
  label: 'Repository',
  description: 'Repository the branch, commit or pull request lives in',
  icon: 'IconGitBranch',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: REPOSITORY_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    REPOSITORY_DEVELOPMENT_DELIVERIES_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'repositoryId',
  },
});
