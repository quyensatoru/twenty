import {
  TEAM_EVENT_KIND_CUSTOM_OPTION_UID,
  TEAM_EVENT_KIND_HOLIDAY_OPTION_UID,
} from './universal-identifiers';

export const TEAM_EVENT_KIND_OPTIONS = [
  {
    id: TEAM_EVENT_KIND_HOLIDAY_OPTION_UID,
    value: 'HOLIDAY',
    label: 'Holiday',
    position: 0,
    color: 'pink',
  },
  {
    id: TEAM_EVENT_KIND_CUSTOM_OPTION_UID,
    value: 'CUSTOM',
    label: 'Custom event',
    position: 1,
    color: 'turquoise',
  },
] as const;
