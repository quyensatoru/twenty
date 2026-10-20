import {
  MEMBER_PROFILE_GENDER_FEMALE_OPTION_UID,
  MEMBER_PROFILE_GENDER_MALE_OPTION_UID,
  MEMBER_PROFILE_GENDER_UNSPECIFIED_OPTION_UID,
} from './universal-identifiers';

export const GENDER_OPTIONS = [
  { id: MEMBER_PROFILE_GENDER_FEMALE_OPTION_UID, value: 'FEMALE', label: 'Female', position: 0, color: 'pink' },
  { id: MEMBER_PROFILE_GENDER_MALE_OPTION_UID, value: 'MALE', label: 'Male', position: 1, color: 'blue' },
  { id: MEMBER_PROFILE_GENDER_UNSPECIFIED_OPTION_UID, value: 'UNSPECIFIED', label: 'Not specified', position: 2, color: 'gray' },
] as const;
