import { ISSUE_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/issue-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type WorklogDataSeed = {
  id: string;
  position: number;
  description: string;
  timeSpentMinutes: number;
  startedAt: string;
  issueId: string;
  memberId: string;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const WORKLOG_DATA_SEED_COLUMNS: (keyof WorklogDataSeed)[] = [
  'id',
  'position',
  'description',
  'timeSpentMinutes',
  'startedAt',
  'issueId',
  'memberId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const WORKLOG_DATA_SEED_IDS = {
  ID_1: '77777774-0001-4e7c-8001-123456789abc',
  ID_2: '77777774-0002-4e7c-8001-123456789abc',
  ID_3: '77777774-0003-4e7c-8001-123456789abc',
  ID_4: '77777774-0004-4e7c-8001-123456789abc',
  ID_5: '77777774-0005-4e7c-8001-123456789abc',
  ID_6: '77777774-0006-4e7c-8001-123456789abc',
};

const { JONY, PHIL, JANE } = WORKSPACE_MEMBER_DATA_SEED_IDS;

const DAYS_FROM_NOW = (days: number): string => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return date.toISOString();
};

const BUILD_CREATED_UPDATED_BY = (workspaceMemberId: string, name: string) => ({
  createdBySource: 'MANUAL',
  createdByWorkspaceMemberId: workspaceMemberId,
  createdByName: name,
  updatedBySource: 'MANUAL',
  updatedByWorkspaceMemberId: workspaceMemberId,
  updatedByName: name,
});

// Sums here match the timeSpentMinutes seeded directly on each issue —
// dev-seeder bulk-inserts worklog rows and doesn't go through the
// worklog.createOne mutation, so the issue rollup post-query hook never runs for seed data.
export const WORKLOG_DATA_SEEDS: WorklogDataSeed[] = [
  {
    id: WORKLOG_DATA_SEED_IDS.ID_1,
    position: 1,
    description: 'Implemented nav bar markup and styles',
    timeSpentMinutes: 240,
    startedAt: DAYS_FROM_NOW(-14),
    issueId: ISSUE_DATA_SEED_IDS.ID_2,
    memberId: JONY,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: WORKLOG_DATA_SEED_IDS.ID_2,
    position: 2,
    description: 'Fixed responsive nav bar issues on mobile',
    timeSpentMinutes: 180,
    startedAt: DAYS_FROM_NOW(-10),
    issueId: ISSUE_DATA_SEED_IDS.ID_2,
    memberId: JONY,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: WORKLOG_DATA_SEED_IDS.ID_3,
    position: 1,
    description: 'Built hero section layout',
    timeSpentMinutes: 90,
    startedAt: DAYS_FROM_NOW(-3),
    issueId: ISSUE_DATA_SEED_IDS.ID_3,
    memberId: PHIL,
    ...BUILD_CREATED_UPDATED_BY(PHIL, 'Phil Schiler'),
  },
  {
    id: WORKLOG_DATA_SEED_IDS.ID_4,
    position: 1,
    description: 'Designed welcome screen 1',
    timeSpentMinutes: 180,
    startedAt: DAYS_FROM_NOW(-16),
    issueId: ISSUE_DATA_SEED_IDS.ID_8,
    memberId: PHIL,
    ...BUILD_CREATED_UPDATED_BY(PHIL, 'Phil Schiler'),
  },
  {
    id: WORKLOG_DATA_SEED_IDS.ID_5,
    position: 2,
    description: 'Designed welcome screen 2',
    timeSpentMinutes: 180,
    startedAt: DAYS_FROM_NOW(-12),
    issueId: ISSUE_DATA_SEED_IDS.ID_8,
    memberId: PHIL,
    ...BUILD_CREATED_UPDATED_BY(PHIL, 'Phil Schiler'),
  },
  {
    id: WORKLOG_DATA_SEED_IDS.ID_6,
    position: 1,
    description: 'Implemented opt-in toggle UI',
    timeSpentMinutes: 60,
    startedAt: DAYS_FROM_NOW(-2),
    issueId: ISSUE_DATA_SEED_IDS.ID_9,
    memberId: JANE,
    ...BUILD_CREATED_UPDATED_BY(JANE, 'Jane Austen'),
  },
];
