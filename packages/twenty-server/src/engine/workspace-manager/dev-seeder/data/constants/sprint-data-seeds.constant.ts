import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';

type SprintDataSeed = {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId: string;
};

export const SPRINT_DATA_SEED_COLUMNS: (keyof SprintDataSeed)[] = [
  'id',
  'name',
  'goal',
  'startDate',
  'endDate',
  'status',
  'projectId',
];

export const SPRINT_DATA_SEED_IDS = {
  SPRINT_1: 'b521eed9-737c-4b5d-91ea-d3fc1c24ed5f',
};

export const SPRINT_DATA_SEEDS: SprintDataSeed[] = [
  {
    id: SPRINT_DATA_SEED_IDS.SPRINT_1,
    name: 'Sprint 1',
    goal: 'Ship the new homepage',
    startDate: '2026-07-01',
    endDate: '2026-07-14',
    status: 'ACTIVE',
    projectId: PROJECT_DATA_SEED_IDS.WEB,
  },
];
