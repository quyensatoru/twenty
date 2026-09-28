import {
  SHIFT_TEMPLATE_DAY_KIND_HOLIDAY_OT_OPTION_UID,
  SHIFT_TEMPLATE_DAY_KIND_WEEKDAY_OPTION_UID,
  SHIFT_TEMPLATE_DAY_KIND_WEEKEND_OPTION_UID,
} from './universal-identifiers';

export const DAY_KIND_OPTIONS = [
  {
    id: SHIFT_TEMPLATE_DAY_KIND_WEEKDAY_OPTION_UID,
    value: 'WEEKDAY',
    label: 'Weekday',
    position: 0,
    color: 'blue',
  },
  {
    id: SHIFT_TEMPLATE_DAY_KIND_WEEKEND_OPTION_UID,
    value: 'WEEKEND',
    label: 'Weekend',
    position: 1,
    color: 'turquoise',
  },
  {
    id: SHIFT_TEMPLATE_DAY_KIND_HOLIDAY_OT_OPTION_UID,
    value: 'HOLIDAY_OT',
    label: 'Holiday OT',
    position: 2,
    color: 'orange',
  },
] as const;
