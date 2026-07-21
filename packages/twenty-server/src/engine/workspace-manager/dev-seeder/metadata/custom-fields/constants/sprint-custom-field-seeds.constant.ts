import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const SPRINT_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Goal',
    name: 'goal',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Start Date',
    name: 'startDate',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'End Date',
    name: 'endDate',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    options: [
      {
        id: '3dded968-d812-4ed7-a6ee-4e6e1f4fe6f2',
        label: 'Planned',
        value: 'PLANNED',
        position: 0,
        color: 'gray',
      },
      {
        id: '4748c338-79ab-44b3-85c9-7360b5a0acbb',
        label: 'Active',
        value: 'ACTIVE',
        position: 1,
        color: 'green',
      },
      {
        id: '7dc51637-be11-467f-ab79-56b806eaff2d',
        label: 'Completed',
        value: 'COMPLETED',
        position: 2,
        color: 'blue',
      },
    ],
  },
];
