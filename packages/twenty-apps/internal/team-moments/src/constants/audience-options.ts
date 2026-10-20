import {
  TEAM_EVENT_AUDIENCE_EVERYONE_OPTION_UID,
  TEAM_EVENT_AUDIENCE_MEN_OPTION_UID,
  TEAM_EVENT_AUDIENCE_WOMEN_OPTION_UID,
} from './universal-identifiers';

export const AUDIENCE_OPTIONS = [
  { id: TEAM_EVENT_AUDIENCE_EVERYONE_OPTION_UID, value: 'EVERYONE', label: 'Everyone', position: 0, color: 'gray' },
  { id: TEAM_EVENT_AUDIENCE_WOMEN_OPTION_UID, value: 'WOMEN', label: 'Women', position: 1, color: 'pink' },
  { id: TEAM_EVENT_AUDIENCE_MEN_OPTION_UID, value: 'MEN', label: 'Men', position: 2, color: 'blue' },
] as const;
