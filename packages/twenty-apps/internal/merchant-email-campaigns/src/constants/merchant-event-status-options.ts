export const MERCHANT_EVENT_STATUS_OPTIONS = [
  { value: 'MATCHED', label: 'Matched', position: 0, color: 'green' },
  {
    value: 'UNMATCHED',
    label: 'No merchant found',
    position: 1,
    color: 'orange',
  },
] as const;
