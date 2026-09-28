export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft', position: 0, color: 'gray' },
  { value: 'ACTIVE', label: 'Active', position: 1, color: 'green' },
  { value: 'PAUSED', label: 'Paused', position: 2, color: 'orange' },
  { value: 'SCHEDULED', label: 'Scheduled', position: 3, color: 'sky' },
  { value: 'SENDING', label: 'Sending', position: 4, color: 'blue' },
  { value: 'SENT', label: 'Sent', position: 5, color: 'turquoise' },
  { value: 'CANCELED', label: 'Canceled', position: 6, color: 'red' },
] as const;
