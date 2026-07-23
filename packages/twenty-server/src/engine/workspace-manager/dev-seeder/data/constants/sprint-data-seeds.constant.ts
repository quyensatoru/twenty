import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type SprintDataSeed = {
  id: string;
  position: number;
  name: string;
  state: string;
  goal: string;
  startDate: string;
  endDate: string;
  completeDate: string | null;
  projectId: string;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const SPRINT_DATA_SEED_COLUMNS: (keyof SprintDataSeed)[] = [
  'id',
  'position',
  'name',
  'state',
  'goal',
  'startDate',
  'endDate',
  'completeDate',
  'projectId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const SPRINT_DATA_SEED_IDS = {
  ID_1: '77777771-0001-4e7c-8001-123456789abc',
  ID_2: '77777771-0002-4e7c-8001-123456789abc',
  ID_3: '77777771-0003-4e7c-8001-123456789abc',
  ID_4: '77777771-0004-4e7c-8001-123456789abc',
};

const DAYS_FROM_NOW = (days: number): string => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString();
};

export const SPRINT_DATA_SEEDS: SprintDataSeed[] = [
  {
    id: SPRINT_DATA_SEED_IDS.ID_1,
    position: 1,
    name: 'Web Sprint 1',
    state: 'CLOSED',
    goal: 'Ship the new navigation and homepage hero section.',
    startDate: DAYS_FROM_NOW(-21),
    endDate: DAYS_FROM_NOW(-7),
    completeDate: DAYS_FROM_NOW(-7),
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    createdByName: 'Tim Apple',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    updatedByName: 'Tim Apple',
  },
  {
    id: SPRINT_DATA_SEED_IDS.ID_2,
    position: 2,
    name: 'Web Sprint 2',
    state: 'ACTIVE',
    goal: 'Polish visual design and fix outstanding bugs.',
    startDate: DAYS_FROM_NOW(-7),
    endDate: DAYS_FROM_NOW(7),
    completeDate: null,
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    createdByName: 'Tim Apple',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    updatedByName: 'Tim Apple',
  },
  {
    id: SPRINT_DATA_SEED_IDS.ID_3,
    position: 1,
    name: 'Mobile Sprint 1',
    state: 'CLOSED',
    goal: 'Build the onboarding welcome screens.',
    startDate: DAYS_FROM_NOW(-21),
    endDate: DAYS_FROM_NOW(-7),
    completeDate: DAYS_FROM_NOW(-7),
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    createdByName: 'Jony Ive',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    updatedByName: 'Jony Ive',
  },
  {
    id: SPRINT_DATA_SEED_IDS.ID_4,
    position: 2,
    name: 'Mobile Sprint 2',
    state: 'ACTIVE',
    goal: 'Ship push notification opt-in and fix login crash.',
    startDate: DAYS_FROM_NOW(-7),
    endDate: DAYS_FROM_NOW(7),
    completeDate: null,
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    createdBySource: 'MANUAL',
    createdByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    createdByName: 'Jony Ive',
    updatedBySource: 'MANUAL',
    updatedByWorkspaceMemberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    updatedByName: 'Jony Ive',
  },
];
