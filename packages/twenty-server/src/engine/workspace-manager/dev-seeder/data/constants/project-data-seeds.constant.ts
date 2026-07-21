import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type ProjectDataSeed = {
  id: string;
  name: string;
  key: string;
  status: string;
  leadId: string;
};

export const PROJECT_DATA_SEED_COLUMNS: (keyof ProjectDataSeed)[] = [
  'id',
  'name',
  'key',
  'status',
  'leadId',
];

export const PROJECT_DATA_SEED_IDS = {
  WEB: '2b38ea84-71a4-45e1-b94b-b712971cf697',
};

export const PROJECT_DATA_SEEDS: ProjectDataSeed[] = [
  {
    id: PROJECT_DATA_SEED_IDS.WEB,
    name: 'Website Redesign',
    key: 'WEB',
    status: 'ACTIVE',
    leadId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
  },
];
