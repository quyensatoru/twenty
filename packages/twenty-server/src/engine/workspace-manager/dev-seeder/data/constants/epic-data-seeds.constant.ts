import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';

type EpicDataSeed = {
  id: string;
  name: string;
  status: string;
  projectId: string;
};

export const EPIC_DATA_SEED_COLUMNS: (keyof EpicDataSeed)[] = [
  'id',
  'name',
  'status',
  'projectId',
];

export const EPIC_DATA_SEED_IDS = {
  HOMEPAGE_REVAMP: '790de18c-90b8-4bc9-aea9-3958c37f16e3',
};

export const EPIC_DATA_SEEDS: EpicDataSeed[] = [
  {
    id: EPIC_DATA_SEED_IDS.HOMEPAGE_REVAMP,
    name: 'Homepage Revamp',
    status: 'IN_PROGRESS',
    projectId: PROJECT_DATA_SEED_IDS.WEB,
  },
];
