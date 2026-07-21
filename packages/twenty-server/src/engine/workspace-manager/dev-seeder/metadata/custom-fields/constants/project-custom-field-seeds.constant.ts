import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const PROJECT_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Key',
    name: 'key',
  },
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
        id: '754c7665-95f2-4562-8b94-772427d6e124',
        label: 'Active',
        value: 'ACTIVE',
        position: 0,
        color: 'green',
      },
      {
        id: 'd059f268-9160-4241-884f-770bd1a8fdbb',
        label: 'Archived',
        value: 'ARCHIVED',
        position: 1,
        color: 'gray',
      },
    ],
  },
];
