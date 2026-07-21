import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const PROJECT_MEMBER_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    label: 'Project Role',
    name: 'projectRole',
    options: [
      {
        id: '442676e2-36a1-4d4a-b839-7093d2bcd64a',
        label: 'Admin',
        value: 'ADMIN',
        position: 0,
        color: 'red',
      },
      {
        id: '27bf8784-3227-48cd-ac06-7c74079a04f4',
        label: 'Member',
        value: 'MEMBER',
        position: 1,
        color: 'blue',
      },
      {
        id: '57400d97-97ff-4a61-a578-b648a8f55878',
        label: 'Viewer',
        value: 'VIEWER',
        position: 2,
        color: 'gray',
      },
    ],
  },
];
