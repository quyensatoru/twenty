// Stage list lives here rather than in the object definition so adding
// "Follow-up 3" later is one entry plus a redeploy, and so the logic functions
// can reason about which stages count as closed without duplicating strings.
export const UPSELL_DEAL_STAGE_OPTIONS = [
  {
    id: 'fc9e7119-7547-4779-89c0-6e25b3af470f',
    value: 'NOT_CONTACTED',
    label: 'Not contacted',
    position: 0,
    color: 'gray',
  },
  {
    id: '1599e943-ee5e-466e-8271-2182b18eb4ef',
    value: 'OUTREACHED',
    label: 'Outreached',
    position: 1,
    color: 'blue',
  },
  {
    id: '1c2ed70d-7fe3-4073-aa17-9649ba412760',
    value: 'FOLLOW_UP_1',
    label: 'Follow-up 1',
    position: 2,
    color: 'turquoise',
  },
  {
    id: 'a49a8f4e-9d8b-46cc-904b-a9286f4b515e',
    value: 'FOLLOW_UP_2',
    label: 'Follow-up 2',
    position: 3,
    color: 'sky',
  },
  {
    id: '6c94c316-0d86-4f28-b02e-c960ab819fbd',
    value: 'DEMO',
    label: 'Demo',
    position: 4,
    color: 'purple',
  },
  {
    id: '49e28b46-036b-4cdf-8eb9-e3496394d383',
    value: 'NEGOTIATION',
    label: 'Negotiation',
    position: 5,
    color: 'orange',
  },
  {
    id: 'beef0d67-5071-4664-a055-058aca097c43',
    value: 'CONVERTED',
    label: 'Converted',
    position: 6,
    color: 'green',
  },
  {
    id: 'fcfe90ba-a94e-4363-87d8-f5cb5043b87f',
    value: 'REJECTED',
    label: 'Rejected',
    position: 7,
    color: 'red',
  },
] as const;

export const UPSELL_DEAL_DEFAULT_STAGE = 'NOT_CONTACTED';

export const UPSELL_DEAL_CLOSED_STAGES = ['CONVERTED', 'REJECTED'];
