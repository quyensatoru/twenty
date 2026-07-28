import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type EpicDataSeed = {
  id: string;
  position: number;
  name: string;
  projectId: string;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const EPIC_DATA_SEED_COLUMNS: (keyof EpicDataSeed)[] = [
  'id',
  'position',
  'name',
  'projectId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const EPIC_DATA_SEED_IDS = {
  ID_1: '77777775-0001-4e7c-8001-123456789abc',
  ID_2: '77777775-0002-4e7c-8001-123456789abc',
};

export const EPIC_DATA_SEEDS: EpicDataSeed[] = [
  {
    id: EPIC_DATA_SEED_IDS.ID_1,
    position: 1,
    name: 'Website Redesign',
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    createdByName: 'Jony Ive',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    updatedByName: 'Jony Ive',
  },
  {
    id: EPIC_DATA_SEED_IDS.ID_2,
    position: 2,
    name: 'Mobile App Launch',
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    createdByName: 'Phil Schiler',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    updatedByName: 'Phil Schiler',
  },
];
