import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const ISSUE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.RICH_TEXT,
    label: 'Description',
    name: 'description',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Issue Type',
    name: 'issueType',
    options: [
      {
        id: 'c7a6d577-12d7-4b04-97a3-9b60765a9b62',
        label: 'Story',
        value: 'STORY',
        position: 0,
        color: 'green',
      },
      {
        id: '53cacb1a-ad1f-4ec3-9d66-3ee5781b9c6a',
        label: 'Task',
        value: 'TASK',
        position: 1,
        color: 'blue',
      },
      {
        id: '0c448488-2764-49a4-8bf1-3af46b62a4a3',
        label: 'Bug',
        value: 'BUG',
        position: 2,
        color: 'red',
      },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'status',
    options: [
      {
        id: '9d00fbac-439e-4647-9112-dab09bfb95d3',
        label: 'Backlog',
        value: 'BACKLOG',
        position: 0,
        color: 'gray',
      },
      {
        id: '24624fa4-1a91-405d-b7c7-efab9ead8420',
        label: 'Todo',
        value: 'TODO',
        position: 1,
        color: 'sky',
      },
      {
        id: 'd885945e-581a-497a-84a5-7ef5c7ec27dc',
        label: 'In Progress',
        value: 'IN_PROGRESS',
        position: 2,
        color: 'purple',
      },
      {
        id: '79bc3bbd-e5d9-417e-be1e-31e4cec18f96',
        label: 'In Review',
        value: 'IN_REVIEW',
        position: 3,
        color: 'yellow',
      },
      {
        id: 'c77afc9e-c486-4036-a86d-f7a5eeceaca4',
        label: 'Done',
        value: 'DONE',
        position: 4,
        color: 'green',
      },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Priority',
    name: 'priority',
    options: [
      {
        id: '2fe481ab-cdd8-4198-a64a-6f847552a56a',
        label: 'Lowest',
        value: 'LOWEST',
        position: 0,
        color: 'gray',
      },
      {
        id: 'd7aeff5a-409d-49f7-84a4-b233226047fb',
        label: 'Low',
        value: 'LOW',
        position: 1,
        color: 'blue',
      },
      {
        id: '020b5e11-4eae-4c61-9c09-45fdb1063882',
        label: 'Medium',
        value: 'MEDIUM',
        position: 2,
        color: 'yellow',
      },
      {
        id: '20b70c3f-8dbd-411a-8983-1d97725c3e64',
        label: 'High',
        value: 'HIGH',
        position: 3,
        color: 'orange',
      },
      {
        id: '6a53a342-bcdb-45e5-b83c-ca2383352406',
        label: 'Highest',
        value: 'HIGHEST',
        position: 4,
        color: 'red',
      },
    ],
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Story Points',
    name: 'storyPoints',
  },
];
