import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type ProjectMemberDataSeed = {
  id: string;
  projectId: string;
  workspaceMemberId: string;
  projectRole: string;
};

export const PROJECT_MEMBER_DATA_SEED_COLUMNS: (keyof ProjectMemberDataSeed)[] =
  ['id', 'projectId', 'workspaceMemberId', 'projectRole'];

export const PROJECT_MEMBER_DATA_SEED_IDS = {
  TIM: '39b1ee48-d62b-47ab-b626-9f6fd317aabb',
  JONY: '6fc92a7a-efad-427f-b7e1-d7f5b884721e',
  PHIL: '16ab55fc-d5cf-4c28-b12a-a97427a6ee50',
};

export const PROJECT_MEMBER_DATA_SEEDS: ProjectMemberDataSeed[] = [
  {
    id: PROJECT_MEMBER_DATA_SEED_IDS.TIM,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    projectRole: 'ADMIN',
  },
  {
    id: PROJECT_MEMBER_DATA_SEED_IDS.JONY,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    projectRole: 'MEMBER',
  },
  {
    id: PROJECT_MEMBER_DATA_SEED_IDS.PHIL,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    workspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    projectRole: 'VIEWER',
  },
];
