import { EPIC_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/epic-data-seeds.constant';
import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';
import { SPRINT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/sprint-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type IssueDataSeed = {
  id: string;
  position: number;
  title: string;
  issueKey: string;
  descriptionBlocknote: string;
  descriptionMarkdown: string;
  issueType: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  originalEstimateMinutes: number | null;
  remainingEstimateMinutes: number | null;
  timeSpentMinutes: number | null;
  assigneeId: string | null;
  reporterId: string | null;
  projectId: string;
  sprintId: string | null;
  epicId: string | null;
  parentId: string | null;
  createdBySource: string;
  createdByWorkspaceMemberId: string;
  createdByName: string;
  updatedBySource: string;
  updatedByWorkspaceMemberId: string;
  updatedByName: string;
};

export const ISSUE_DATA_SEED_COLUMNS: (keyof IssueDataSeed)[] = [
  'id',
  'position',
  'title',
  'issueKey',
  'descriptionBlocknote',
  'descriptionMarkdown',
  'issueType',
  'status',
  'priority',
  'storyPoints',
  'originalEstimateMinutes',
  'remainingEstimateMinutes',
  'timeSpentMinutes',
  'assigneeId',
  'reporterId',
  'projectId',
  'sprintId',
  'epicId',
  'parentId',
  'createdBySource',
  'createdByWorkspaceMemberId',
  'createdByName',
  'updatedBySource',
  'updatedByWorkspaceMemberId',
  'updatedByName',
];

export const ISSUE_DATA_SEED_IDS = {
  ID_2: '77777772-0002-4e7c-8001-123456789abc',
  ID_3: '77777772-0003-4e7c-8001-123456789abc',
  ID_4: '77777772-0004-4e7c-8001-123456789abc',
  ID_5: '77777772-0005-4e7c-8001-123456789abc',
  ID_6: '77777772-0006-4e7c-8001-123456789abc',
  ID_8: '77777772-0008-4e7c-8001-123456789abc',
  ID_9: '77777772-0009-4e7c-8001-123456789abc',
  ID_10: '77777772-0010-4e7c-8001-123456789abc',
  ID_11: '77777772-0011-4e7c-8001-123456789abc',
  ID_12: '77777772-0012-4e7c-8001-123456789abc',
};

const { TIM, JONY, PHIL, JANE } = WORKSPACE_MEMBER_DATA_SEED_IDS;

const BUILD_BLOCKNOTE_BODY = (text: string): string =>
  JSON.stringify([
    {
      id: 'block-1',
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left',
      },
      content: [{ type: 'text', text, styles: {} }],
      children: [],
    },
  ]);

const BUILD_CREATED_UPDATED_BY = (workspaceMemberId: string, name: string) => ({
  createdBySource: 'MANUAL',
  createdByWorkspaceMemberId: workspaceMemberId,
  createdByName: name,
  updatedBySource: 'MANUAL',
  updatedByWorkspaceMemberId: workspaceMemberId,
  updatedByName: name,
});

export const ISSUE_DATA_SEEDS: IssueDataSeed[] = [
  {
    id: ISSUE_DATA_SEED_IDS.ID_2,
    position: 2,
    title: 'Implement new nav bar',
    issueKey: 'WEB-2',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Build the responsive nav bar matching the new design system.',
    ),
    descriptionMarkdown:
      'Build the responsive nav bar matching the new design system.',
    issueType: 'STORY',
    status: 'DONE',
    priority: 'MEDIUM',
    storyPoints: 5,
    originalEstimateMinutes: 480,
    remainingEstimateMinutes: 60,
    timeSpentMinutes: 420,
    assigneeId: JONY,
    reporterId: TIM,
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    sprintId: SPRINT_DATA_SEED_IDS.ID_1,
    epicId: EPIC_DATA_SEED_IDS.ID_1,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_3,
    position: 3,
    title: 'Add hero section',
    issueKey: 'WEB-3',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Design and build the homepage hero section with the new brand colors.',
    ),
    descriptionMarkdown:
      'Design and build the homepage hero section with the new brand colors.',
    issueType: 'STORY',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    storyPoints: 3,
    originalEstimateMinutes: 240,
    remainingEstimateMinutes: 150,
    timeSpentMinutes: 90,
    assigneeId: PHIL,
    reporterId: TIM,
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    sprintId: SPRINT_DATA_SEED_IDS.ID_2,
    epicId: EPIC_DATA_SEED_IDS.ID_1,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_4,
    position: 4,
    title: 'Update favicon',
    issueKey: 'WEB-4',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Replace the favicon with the new logo mark.',
    ),
    descriptionMarkdown: 'Replace the favicon with the new logo mark.',
    issueType: 'TASK',
    status: 'TODO',
    priority: 'LOW',
    storyPoints: null,
    originalEstimateMinutes: 30,
    remainingEstimateMinutes: 30,
    timeSpentMinutes: 0,
    assigneeId: JANE,
    reporterId: TIM,
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    sprintId: SPRINT_DATA_SEED_IDS.ID_2,
    epicId: null,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_5,
    position: 5,
    title: 'Fix broken footer link',
    issueKey: 'WEB-5',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'The privacy policy link in the footer returns a 404.',
    ),
    descriptionMarkdown: 'The privacy policy link in the footer returns a 404.',
    issueType: 'BUG',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    storyPoints: null,
    originalEstimateMinutes: 60,
    remainingEstimateMinutes: 15,
    timeSpentMinutes: 45,
    assigneeId: TIM,
    reporterId: JANE,
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    sprintId: SPRINT_DATA_SEED_IDS.ID_2,
    epicId: null,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(JANE, 'Jane Austen'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_6,
    position: 6,
    title: 'Write SEO meta tags',
    issueKey: 'WEB-6',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Add meta title/description tags for every marketing page.',
    ),
    descriptionMarkdown:
      'Add meta title/description tags for every marketing page.',
    issueType: 'TASK',
    status: 'BACKLOG',
    priority: 'LOWEST',
    storyPoints: null,
    originalEstimateMinutes: null,
    remainingEstimateMinutes: null,
    timeSpentMinutes: 0,
    assigneeId: null,
    reporterId: TIM,
    projectId: PROJECT_DATA_SEED_IDS.ID_1,
    sprintId: null,
    epicId: null,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_8,
    position: 8,
    title: 'Build welcome screens',
    issueKey: 'MOB-2',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Design and implement the 3-screen welcome carousel.',
    ),
    descriptionMarkdown: 'Design and implement the 3-screen welcome carousel.',
    issueType: 'STORY',
    status: 'DONE',
    priority: 'MEDIUM',
    storyPoints: 5,
    originalEstimateMinutes: 360,
    remainingEstimateMinutes: 0,
    timeSpentMinutes: 360,
    assigneeId: PHIL,
    reporterId: JONY,
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    sprintId: SPRINT_DATA_SEED_IDS.ID_3,
    epicId: EPIC_DATA_SEED_IDS.ID_2,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_9,
    position: 9,
    title: 'Add push notification opt-in',
    issueKey: 'MOB-3',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Ask users to opt in to push notifications after onboarding.',
    ),
    descriptionMarkdown:
      'Ask users to opt in to push notifications after onboarding.',
    issueType: 'STORY',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    storyPoints: 3,
    originalEstimateMinutes: 240,
    remainingEstimateMinutes: 180,
    timeSpentMinutes: 60,
    assigneeId: JANE,
    reporterId: JONY,
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    sprintId: SPRINT_DATA_SEED_IDS.ID_4,
    epicId: EPIC_DATA_SEED_IDS.ID_2,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(JONY, 'Jony Ive'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_10,
    position: 10,
    title: 'Crash on login screen',
    issueKey: 'MOB-4',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'App crashes when submitting the login form with an empty password.',
    ),
    descriptionMarkdown:
      'App crashes when submitting the login form with an empty password.',
    issueType: 'BUG',
    status: 'IN_REVIEW',
    priority: 'HIGHEST',
    storyPoints: null,
    originalEstimateMinutes: 120,
    remainingEstimateMinutes: 30,
    timeSpentMinutes: 90,
    assigneeId: TIM,
    reporterId: PHIL,
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    sprintId: SPRINT_DATA_SEED_IDS.ID_4,
    epicId: null,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(PHIL, 'Phil Schiler'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_11,
    position: 11,
    title: 'Update app icon',
    issueKey: 'MOB-5',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'Replace the app icon with the refreshed brand mark.',
    ),
    descriptionMarkdown: 'Replace the app icon with the refreshed brand mark.',
    issueType: 'TASK',
    status: 'TODO',
    priority: 'LOW',
    storyPoints: null,
    originalEstimateMinutes: 45,
    remainingEstimateMinutes: 45,
    timeSpentMinutes: 0,
    assigneeId: JANE,
    reporterId: TIM,
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    sprintId: SPRINT_DATA_SEED_IDS.ID_4,
    epicId: null,
    parentId: null,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
  {
    id: ISSUE_DATA_SEED_IDS.ID_12,
    position: 12,
    title: 'Fix icon padding',
    issueKey: 'MOB-6',
    descriptionBlocknote: BUILD_BLOCKNOTE_BODY(
      'The new app icon has inconsistent padding on Android.',
    ),
    descriptionMarkdown:
      'The new app icon has inconsistent padding on Android.',
    issueType: 'SUBTASK',
    status: 'TODO',
    priority: 'LOW',
    storyPoints: null,
    originalEstimateMinutes: 20,
    remainingEstimateMinutes: 20,
    timeSpentMinutes: 0,
    assigneeId: JANE,
    reporterId: TIM,
    projectId: PROJECT_DATA_SEED_IDS.ID_2,
    sprintId: SPRINT_DATA_SEED_IDS.ID_4,
    epicId: null,
    parentId: ISSUE_DATA_SEED_IDS.ID_11,
    ...BUILD_CREATED_UPDATED_BY(TIM, 'Tim Apple'),
  },
];
