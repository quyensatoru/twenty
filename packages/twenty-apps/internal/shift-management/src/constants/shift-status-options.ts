import {
  SHIFT_STATUS_CANCELLED_OPTION_UID,
  SHIFT_STATUS_COMPLETED_OPTION_UID,
  SHIFT_STATUS_IN_PROGRESS_OPTION_UID,
  SHIFT_STATUS_UPCOMING_OPTION_UID,
} from './universal-identifiers';

export const SHIFT_STATUS_OPTIONS = [
  {
    id: SHIFT_STATUS_UPCOMING_OPTION_UID,
    value: 'UPCOMING',
    label: 'Upcoming',
    position: 0,
    color: 'blue',
  },
  {
    id: SHIFT_STATUS_IN_PROGRESS_OPTION_UID,
    value: 'IN_PROGRESS',
    label: 'In progress',
    position: 1,
    color: 'yellow',
  },
  {
    id: SHIFT_STATUS_COMPLETED_OPTION_UID,
    value: 'COMPLETED',
    label: 'Completed',
    position: 2,
    color: 'green',
  },
  {
    id: SHIFT_STATUS_CANCELLED_OPTION_UID,
    value: 'CANCELLED',
    label: 'Cancelled',
    position: 3,
    color: 'red',
  },
] as const;
