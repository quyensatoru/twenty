import {
  SPECIAL_DAY_KIND_SPECIFIC_OPTION_UID,
  SPECIAL_DAY_KIND_YEARLY_OPTION_UID,
} from './universal-identifiers';

export const SPECIAL_DAY_KIND_OPTIONS = [
  {
    id: SPECIAL_DAY_KIND_YEARLY_OPTION_UID,
    value: 'YEARLY',
    label: 'Yearly',
    position: 0,
    color: 'green',
  },
  {
    id: SPECIAL_DAY_KIND_SPECIFIC_OPTION_UID,
    value: 'SPECIFIC',
    label: 'Specific date',
    position: 1,
    color: 'purple',
  },
] as const;
