import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_READ_STATE_OBJECT_UID,
  ISSUE_READ_STATE_COMMENT_ID_FIELD_UID,
  ISSUE_READ_STATE_MEMBER_ID_FIELD_UID,
  ISSUE_READ_STATE_LAST_READ_AT_FIELD_UID,
} from '../constants/discussion';

export default defineObject({
  universalIdentifier: ISSUE_READ_STATE_OBJECT_UID,
  nameSingular: 'issueReadState',
  namePlural: 'issueReadStates',
  labelSingular: 'Issue Read State',
  labelPlural: 'Issue Read States',
  description: 'Task discussion issue read state',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_READ_STATE_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: ISSUE_READ_STATE_COMMENT_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'commentId',
      label: 'Comment Id',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier: ISSUE_READ_STATE_MEMBER_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'memberId',
      label: 'Member Id',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_READ_STATE_LAST_READ_AT_FIELD_UID,
      type: FieldType.DATE_TIME,
      name: 'lastReadAt',
      label: 'Last Read At',
      isNullable: true,
      icon: 'IconMessage',
    },
  ],
});
