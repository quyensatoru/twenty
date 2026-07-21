import { EPIC_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/epic-data-seeds.constant';
import { PROJECT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/project-data-seeds.constant';
import { SPRINT_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/sprint-data-seeds.constant';
import { WORKSPACE_MEMBER_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/workspace-member-data-seeds.constant';

type IssueDataSeed = {
  id: string;
  name: string;
  issueType: string;
  status: string;
  priority: string;
  storyPoints: number;
  position: number;
  projectId: string;
  epicId: string | null;
  sprintId: string | null;
  assigneeId: string | null;
  reporterId: string | null;
  parentIssueId: string | null;
};

export const ISSUE_DATA_SEED_COLUMNS: (keyof IssueDataSeed)[] = [
  'id',
  'name',
  'issueType',
  'status',
  'priority',
  'storyPoints',
  'position',
  'projectId',
  'epicId',
  'sprintId',
  'assigneeId',
  'reporterId',
  'parentIssueId',
];

export const ISSUE_DATA_SEED_IDS = {
  DESIGN_HERO: 'e62d2f77-8fb1-4ff5-8802-dbd626ef4aaf',
  RESPONSIVE_HEADER: '1b64fb7f-f86c-4d19-8e12-a1cd08969010',
  MOBILE_NAV_BUG: '94b4e97f-fa69-4fb6-9049-a16ec9da8b8c',
  HOMEPAGE_COPY: '7fe78ce6-ac64-443f-8ec4-c865dcbbf23e',
  ANALYTICS_SETUP: 'd16aaa9a-968b-438f-9946-de6db6c72c2d',
  ANALYTICS_CTA_EVENT: '59c3cdd3-03a5-4bf7-ab44-1331477fbd5c',
  Q3_ROADMAP: '09ad56ce-82f4-46c0-8a98-2840f8276a1c',
  COMPETITOR_RESEARCH: '09fe75f0-42aa-44ff-a694-1a3b3df277cb',
};

export const ISSUE_DATA_SEEDS: IssueDataSeed[] = [
  {
    id: ISSUE_DATA_SEED_IDS.DESIGN_HERO,
    name: 'Design new hero section',
    issueType: 'STORY',
    status: 'DONE',
    priority: 'HIGH',
    storyPoints: 5,
    position: 1,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: EPIC_DATA_SEED_IDS.HOMEPAGE_REVAMP,
    sprintId: SPRINT_DATA_SEED_IDS.SPRINT_1,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    parentIssueId: null,
  },
  {
    id: ISSUE_DATA_SEED_IDS.RESPONSIVE_HEADER,
    name: 'Implement responsive header',
    issueType: 'TASK',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    storyPoints: 3,
    position: 2,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: EPIC_DATA_SEED_IDS.HOMEPAGE_REVAMP,
    sprintId: SPRINT_DATA_SEED_IDS.SPRINT_1,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    parentIssueId: null,
  },
  {
    id: ISSUE_DATA_SEED_IDS.MOBILE_NAV_BUG,
    name: 'Fix mobile nav overlap bug',
    issueType: 'BUG',
    status: 'IN_REVIEW',
    priority: 'HIGH',
    storyPoints: 2,
    position: 3,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: null,
    sprintId: SPRINT_DATA_SEED_IDS.SPRINT_1,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    parentIssueId: null,
  },
  {
    id: ISSUE_DATA_SEED_IDS.HOMEPAGE_COPY,
    name: 'Write homepage copy',
    issueType: 'TASK',
    status: 'TODO',
    priority: 'LOW',
    storyPoints: 1,
    position: 4,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: EPIC_DATA_SEED_IDS.HOMEPAGE_REVAMP,
    sprintId: SPRINT_DATA_SEED_IDS.SPRINT_1,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    parentIssueId: null,
  },
  {
    id: ISSUE_DATA_SEED_IDS.ANALYTICS_SETUP,
    name: 'Set up analytics tracking',
    issueType: 'TASK',
    status: 'TODO',
    priority: 'MEDIUM',
    storyPoints: 3,
    position: 5,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: null,
    sprintId: SPRINT_DATA_SEED_IDS.SPRINT_1,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    parentIssueId: null,
  },
  {
    id: ISSUE_DATA_SEED_IDS.ANALYTICS_CTA_EVENT,
    name: 'Add GA4 event for CTA click',
    issueType: 'TASK',
    status: 'TODO',
    priority: 'LOW',
    storyPoints: 1,
    position: 6,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: null,
    sprintId: SPRINT_DATA_SEED_IDS.SPRINT_1,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.PHIL,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    parentIssueId: ISSUE_DATA_SEED_IDS.ANALYTICS_SETUP,
  },
  {
    id: ISSUE_DATA_SEED_IDS.Q3_ROADMAP,
    name: 'Plan Q3 roadmap',
    issueType: 'STORY',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    storyPoints: 8,
    position: 7,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: null,
    sprintId: null,
    assigneeId: null,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    parentIssueId: null,
  },
  {
    id: ISSUE_DATA_SEED_IDS.COMPETITOR_RESEARCH,
    name: 'Research competitor sites',
    issueType: 'TASK',
    status: 'BACKLOG',
    priority: 'LOWEST',
    storyPoints: 2,
    position: 8,
    projectId: PROJECT_DATA_SEED_IDS.WEB,
    epicId: null,
    sprintId: null,
    assigneeId: WORKSPACE_MEMBER_DATA_SEED_IDS.JONY,
    reporterId: WORKSPACE_MEMBER_DATA_SEED_IDS.TIM,
    parentIssueId: null,
  },
];
