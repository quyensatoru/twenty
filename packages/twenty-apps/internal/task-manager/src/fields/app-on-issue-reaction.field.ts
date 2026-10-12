import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ISSUE_REACTION_OBJECT_UID,
  ISSUE_REACTION_APP_FIELD_UID,
  APP_ISSUE_REACTIONS_FIELD_UID,
} from '../constants/discussion';
import { APP_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: ISSUE_REACTION_APP_FIELD_UID,
  objectUniversalIdentifier: ISSUE_REACTION_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'app',
  label: 'App',
  icon: 'IconMessage',
  isNullable: false,
  relationTargetObjectMetadataUniversalIdentifier: APP_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: APP_ISSUE_REACTIONS_FIELD_UID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'appId',
  },
});
