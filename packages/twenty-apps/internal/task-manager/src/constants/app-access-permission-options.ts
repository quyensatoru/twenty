export const APP_ACCESS_PERMISSION_OPTIONS = [
  {
    id: '52f56558-029b-476c-b7c0-9e76c88ca7e8',
    value: 'READ',
    label: 'Read',
    position: 0,
    color: 'blue',
  },
  {
    id: 'fd804a65-c33d-4518-9c3e-7454827c4476',
    value: 'WRITE',
    label: 'Write',
    position: 1,
    color: 'green',
  },
  {
    id: 'cee7909e-95dd-4b61-9f5e-3455ac635973',
    value: 'SOFT_DELETE',
    label: 'Soft delete',
    position: 2,
    color: 'orange',
  },
  {
    id: '8367f10b-d877-4db5-8e7d-f8e803d97f53',
    value: 'DESTROY',
    label: 'Destroy',
    position: 3,
    color: 'red',
  },
] as const;
