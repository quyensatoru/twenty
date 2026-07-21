import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const TIME_LOG_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.NUMBER,
    label: 'Minutes Spent',
    name: 'minutesSpent',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Logged Date',
    name: 'loggedDate',
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Description',
    name: 'description',
  },
];
