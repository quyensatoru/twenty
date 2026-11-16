import { defineObject } from 'twenty-sdk/define';

import {
  BC_TEAM_DESCRIPTION_FIELD_UID,
  BC_TEAM_NAME_FIELD_UID,
  BC_TEAM_OBJECT_UID,
} from '../constants/universal-identifiers';
import { textField } from '../utils/field-builders.util';

export default defineObject({
  universalIdentifier: BC_TEAM_OBJECT_UID,
  nameSingular: 'bcTeam',
  namePlural: 'bcTeams',
  labelSingular: 'BC Team',
  labelPlural: 'BC Teams',
  description: 'A team of Business Consultants and its managers',
  icon: 'IconUsersGroup',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier: BC_TEAM_NAME_FIELD_UID,
  fields: [
    textField({
      universalIdentifier: BC_TEAM_NAME_FIELD_UID,
      name: 'name',
      label: 'Name',
      icon: 'IconUsersGroup',
      isSearchable: true,
    }),
    textField({
      universalIdentifier: BC_TEAM_DESCRIPTION_FIELD_UID,
      name: 'description',
      label: 'Description',
      icon: 'IconFileDescription',
    }),
  ],
});
