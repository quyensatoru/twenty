import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const EPIC_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Description',
    name: 'description',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    options: [
      {
        id: '6b91cbdc-0b03-40a0-8d9a-39ac6d8bea5a',
        label: 'Todo',
        value: 'TODO',
        position: 0,
        color: 'sky',
      },
      {
        id: '3a656bf9-36ac-44ee-bf29-3452572d007a',
        label: 'In Progress',
        value: 'IN_PROGRESS',
        position: 1,
        color: 'purple',
      },
      {
        id: '43a6e6eb-be3b-4924-a3f8-423a56c981e8',
        label: 'Done',
        value: 'DONE',
        position: 2,
        color: 'green',
      },
    ],
  },
];
