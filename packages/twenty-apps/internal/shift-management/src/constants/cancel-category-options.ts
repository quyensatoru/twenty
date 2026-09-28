import {
  SHIFT_CANCEL_CATEGORY_OTHER_OPTION_UID,
  SHIFT_CANCEL_CATEGORY_PERSONAL_OPTION_UID,
  SHIFT_CANCEL_CATEGORY_SICK_OPTION_UID,
  SHIFT_CANCEL_CATEGORY_SWAP_OPTION_UID,
} from './universal-identifiers';

export const CANCEL_CATEGORY_OPTIONS = [
  {
    id: SHIFT_CANCEL_CATEGORY_SICK_OPTION_UID,
    value: 'SICK',
    label: 'Sick leave',
    position: 0,
    color: 'red',
  },
  {
    id: SHIFT_CANCEL_CATEGORY_PERSONAL_OPTION_UID,
    value: 'PERSONAL',
    label: 'Personal',
    position: 1,
    color: 'orange',
  },
  {
    id: SHIFT_CANCEL_CATEGORY_SWAP_OPTION_UID,
    value: 'SWAP',
    label: 'Shift swap',
    position: 2,
    color: 'blue',
  },
  {
    id: SHIFT_CANCEL_CATEGORY_OTHER_OPTION_UID,
    value: 'OTHER',
    label: 'Other',
    position: 3,
    color: 'gray',
  },
] as const;

// Server-side allow list for the cancel route; must stay in sync with the
// option values above.
export const CANCEL_CATEGORIES = [
  'SICK',
  'PERSONAL',
  'SWAP',
  'OTHER',
] as const;
