import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  APP_WORKLOGS_FIELD_UID,
  APP_OBJECT_UID,
  WORKLOG_APP_FIELD_UID,
  WORKLOG_OBJECT_UID,
} from '../constants/universal-identifiers';

export default defineField({
  universalIdentifier: APP_WORKLOGS_FIELD_UID,
  objectUniversalIdentifier: APP_OBJECT_UID,
  type: FieldType.RELATION,
  name: 'worklogs',
  label: 'Worklogs',
  description: 'Worklogs belonging to this app',
  icon: 'IconClock',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier: WORKLOG_OBJECT_UID,
  relationTargetFieldMetadataUniversalIdentifier: WORKLOG_APP_FIELD_UID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
