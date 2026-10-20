import { defineObject, FieldType } from 'twenty-sdk/define';

import { GENDER_OPTIONS } from '../constants/gender-options';
import {
  MEMBER_PROFILE_BIRTHDAY_FIELD_UID,
  MEMBER_PROFILE_GENDER_FIELD_UID,
  MEMBER_PROFILE_DISPLAY_NAME_FIELD_UID,
  MEMBER_PROFILE_HIDE_BIRTH_YEAR_FIELD_UID,
  MEMBER_PROFILE_JOINED_AT_FIELD_UID,
  MEMBER_PROFILE_MEMBER_ID_FIELD_UID,
  MEMBER_PROFILE_OBJECT_UID,
} from '../constants/universal-identifiers';

// workspaceMember has no birthday or start date, so the app keeps them here,
// one row per member. Dates are TEXT `YYYY-MM-DD` calendar days: a DATE column
// would shift by a day for members browsing from another time zone.
export default defineObject({
  universalIdentifier: MEMBER_PROFILE_OBJECT_UID,
  nameSingular: 'memberProfile',
  namePlural: 'memberProfiles',
  labelSingular: 'Member Profile',
  labelPlural: 'Member Profiles',
  description: 'Birthday and start date of a workspace member',
  icon: 'IconCake',
  isSearchable: true,
  labelIdentifierFieldMetadataUniversalIdentifier:
    MEMBER_PROFILE_DISPLAY_NAME_FIELD_UID,
  fields: [
    {
      universalIdentifier: MEMBER_PROFILE_DISPLAY_NAME_FIELD_UID,
      type: FieldType.TEXT,
      name: 'displayName',
      label: 'Name',
      description: 'Member name, copied for tables and search',
      icon: 'IconUser',
      isNullable: false,
      defaultValue: "''",
      isSearchable: true,
    },
    {
      universalIdentifier: MEMBER_PROFILE_MEMBER_ID_FIELD_UID,
      type: FieldType.TEXT,
      name: 'memberId',
      label: 'Workspace member id',
      icon: 'IconId',
      isNullable: false,
      defaultValue: "''",
    },
    {
      universalIdentifier: MEMBER_PROFILE_BIRTHDAY_FIELD_UID,
      type: FieldType.TEXT,
      name: 'birthday',
      label: 'Birthday',
      description: 'YYYY-MM-DD',
      icon: 'IconCake',
      isNullable: true,
    },
    {
      universalIdentifier: MEMBER_PROFILE_JOINED_AT_FIELD_UID,
      type: FieldType.TEXT,
      name: 'joinedAt',
      label: 'Joined on',
      description: 'YYYY-MM-DD, first working day',
      icon: 'IconBriefcase',
      isNullable: true,
    },
    {
      universalIdentifier: MEMBER_PROFILE_HIDE_BIRTH_YEAR_FIELD_UID,
      type: FieldType.BOOLEAN,
      name: 'hideBirthYear',
      label: 'Hide birth year',
      description: 'Show only day and month to other members',
      icon: 'IconEyeOff',
      isNullable: false,
      defaultValue: true,
    },
    {
      universalIdentifier: MEMBER_PROFILE_GENDER_FIELD_UID,
      type: FieldType.SELECT,
      name: 'gender',
      label: 'Gender',
      description: 'Decides who a gendered occasion such as 20/10 or 8/3 honours',
      icon: 'IconGenderBigender',
      isNullable: false,
      defaultValue: "'UNSPECIFIED'",
      options: [...GENDER_OPTIONS],
    },
  ],
});
