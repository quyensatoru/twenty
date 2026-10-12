import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ISSUE_READ_STATE_OBJECT_UID,
  ISSUE_READ_STATE_APP_FIELD_UID,
  APP_ISSUE_READ_STATES_FIELD_UID,
} from '../constants/discussion';
import { APP_OBJECT_UID } from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_ISSUE_READ_STATES_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'issueReadStates',
  label: 'Issue Read States',
  icon: 'IconMessage',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: ISSUE_READ_STATE_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier:
    ISSUE_READ_STATE_APP_FIELD_UID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
