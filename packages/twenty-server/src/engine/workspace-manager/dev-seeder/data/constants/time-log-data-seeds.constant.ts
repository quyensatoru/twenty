import { ISSUE_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/issue-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type TimeLogDataSeed = {
  id: string;
  minutesSpent: number;
  loggedDate: string;
  description: string;
  issueId: string;
  memberId: string;
};

export const TIME_LOG_DATA_SEED_COLUMNS: (keyof TimeLogDataSeed)[] = [
  'id',
  'minutesSpent',
  'loggedDate',
  'description',
  'issueId',
  'memberId',
];

export const TIME_LOG_DATA_SEED_IDS = {
  ID_1: '7c3b4d23-e304-4035-9a46-2b87b9bf13b8',
  ID_2: '229bb23f-821f-4cc1-975d-383f57be906b',
  ID_3: 'c012759b-7486-45e7-a13b-ae9e90783635',
};

export const TIME_LOG_DATA_SEEDS: TimeLogDataSeed[] = [
  {
    id: TIME_LOG_DATA_SEED_IDS.ID_1,
    minutesSpent: 240,
    loggedDate: '2026-07-02',
    description: 'Initial hero section mockup',
    issueId: ISSUE_DATA_SEED_IDS.DESIGN_HERO,
    memberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
  },
  {
    id: TIME_LOG_DATA_SEED_IDS.ID_2,
    minutesSpent: 120,
    loggedDate: '2026-07-03',
    description: 'Revisions after feedback',
    issueId: ISSUE_DATA_SEED_IDS.DESIGN_HERO,
    memberId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
  },
  {
    id: TIME_LOG_DATA_SEED_IDS.ID_3,
    minutesSpent: 90,
    loggedDate: '2026-07-04',
    description: 'Header breakpoints',
    issueId: ISSUE_DATA_SEED_IDS.RESPONSIVE_HEADER,
    memberId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
  },
];
