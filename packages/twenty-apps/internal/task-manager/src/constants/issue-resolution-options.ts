export const ISSUE_RESOLUTION_OPTIONS = [
  {
    id: 'c363ead2-e423-4375-9fe4-0b0dedd6c72d',
    value: 'DONE',
    label: 'Done',
    position: 0,
    color: 'green',
  },
  {
    id: '7822f7d8-b81c-417f-a11a-58bac696377c',
    value: 'WONT_DO',
    label: "Won't Do",
    position: 1,
    color: 'gray',
  },
  {
    id: '0a12e51d-b23d-41df-a313-7c3059d8cad5',
    value: 'DUPLICATE',
    label: 'Duplicate',
    position: 2,
    color: 'orange',
  },
  {
    id: '0b2ccfe7-7544-4585-9b8e-62e6af8f7bea',
    value: 'CANNOT_REPRODUCE',
    label: 'Cannot Reproduce',
    position: 3,
    color: 'red',
  },
] as const;
