import { defineObject, FieldType } from 'twenty-sdk/define';

import { getSystemFieldUniversalIdentifier } from '../constants/derived-system-field-identifiers';
import {
  ISSUE_REACTION_OBJECT_UID,
  ISSUE_REACTION_IS_ACTIVE_FIELD_UID,
  ISSUE_REACTION_MEMBER_ID_FIELD_UID,
  ISSUE_REACTION_COMMENT_ID_FIELD_UID,
  ISSUE_REACTION_EMOJI_FIELD_UID,
} from '../constants/discussion';

export default defineObject({
  universalIdentifier: ISSUE_REACTION_OBJECT_UID,
  nameSingular: 'issueReaction',
  namePlural: 'issueReactions',
  labelSingular: 'Issue Reaction',
  labelPlural: 'Issue Reactions',
  description: 'Task discussion issue reaction',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    getSystemFieldUniversalIdentifier({
      objectUniversalIdentifier: ISSUE_REACTION_OBJECT_UID,
      name: 'id',
    }),
  fields: [
    {
      universalIdentifier: ISSUE_REACTION_IS_ACTIVE_FIELD_UID,
      name: 'isActive',
      label: 'Is active',
      type: FieldType.BOOLEAN,
      defaultValue: true,
      icon: 'IconMessage',
      isNullable: false,
    },
    {
      universalIdentifier: ISSUE_REACTION_MEMBER_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'memberId',
      label: 'Member Id',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_REACTION_COMMENT_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'commentId',
      label: 'Comment Id',
      isNullable: true,
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ISSUE_REACTION_EMOJI_FIELD_UID,
      type: FieldType.TEXT,
      name: 'emoji',
      label: 'Emoji',
      isNullable: true,
      icon: 'IconMessage',
    },
  ],
});
