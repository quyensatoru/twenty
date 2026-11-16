import { defineObject } from 'twenty-sdk/define';

import { BC_MEMBER_ROLE_OPTIONS } from '../constants/select-options';
import {
  BC_MEMBER_CRISP_OPERATOR_NAMES_FIELD_UID,
  BC_MEMBER_IS_ACTIVE_FIELD_UID,
  BC_MEMBER_NAME_FIELD_UID,
  BC_MEMBER_OBJECT_UID,
  BC_MEMBER_ROLE_FIELD_UID,
} from '../constants/universal-identifiers';
import {
  arrayField,
  booleanField,
  selectField,
  textField,
} from '../utils/field-builders.util';

// A workspace member's place in a BC team. Managers see their team's clients
// and its financial figures; BCs see only the clients they own.
export default defineObject({
  universalIdentifier: BC_MEMBER_OBJECT_UID,
  nameSingular: 'bcMember',
  namePlural: 'bcMembers',
  labelSingular: 'BC Member',
  labelPlural: 'BC Members',
  description: 'A Business Consultant or manager in a BC team',
  icon: 'IconUserStar',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_MEMBER_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_MEMBER_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      icon: 'IconUser',
      isSearchable: true,
    }),
    selectField({
      universalIdentifier: BC_MEMBER_ROLE_FIELD_UID,
      name: 'memberRole',
      label: 'Role',
      icon: 'IconShield',
      options: BC_MEMBER_ROLE_OPTIONS,
      defaultValue: 'BC',
    }),
    arrayField({
      universalIdentifier: BC_MEMBER_CRISP_OPERATOR_NAMES_FIELD_UID,
      name: 'crispOperatorNames',
      label: 'Crisp operator names',
      description:
        'Names this person sends Crisp messages under, so their messages count as BC contact',
      icon: 'IconMessageCircle',
    }),
    booleanField({
      universalIdentifier: BC_MEMBER_IS_ACTIVE_FIELD_UID,
      name: 'isActive',
      label: 'Active',
      icon: 'IconToggleLeft',
      defaultValue: true,
    }),
  ],
});
