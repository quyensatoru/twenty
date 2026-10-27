import {
  type BoardEpic,
  type BoardMember,
  type BoardProject,
  type BoardSprint,
  type BoardStatus,
} from './task-board';
import { type ProductBacklogAccess } from '../utils/read-product-backlog-access.util';

// ITEM sits in the Product Backlog, ISSUE runs on the Board, ARCHIVED is an
// item retired from the backlog without being deleted.
export type IssueStage = 'ITEM' | 'ISSUE' | 'ARCHIVED';

export type StrategicGoal = {
  id: string;
  name: string;
  // A theme colour name (TAG_COLORS key), so goals follow dark mode.
  color: string;
};

export type ReadinessCriterion = {
  id: string;
  text: string;
};

export type CompetitorType = 'DIRECT' | 'INDIRECT';

export type Competitor = {
  id: string;
  name: string;
  type: CompetitorType;
};

export type Stakeholder = {
  id: string;
  name: string;
};

export type MoscowBucket = 'M' | 'S' | 'C' | 'W';

export type CompetitorAdoption = 'NO' | 'BASIC' | 'GOOD' | 'ADVANCED';

export type ProductBacklogSettings = {
  goals: StrategicGoal[];
  readinessCriteria: ReadinessCriterion[];
  activeTemplateId: string;
  competitors: Competitor[];
  competitorWeights: Record<CompetitorType, number>;
  adoptionScores: Record<CompetitorAdoption, number>;
  phaseThresholds: { phaseOne: number; phaseTwo: number; phaseThree: number };
  moscowPoints: Record<MoscowBucket, number>;
  stakeholders: Stakeholder[];
  lastBacklogReviewAt: string | null;
};

export type UserStory = {
  asA: string;
  iWant: string;
  soThat: string;
};

export type AcceptanceCriterion = {
  id: string;
  text: string;
  isDone: boolean;
};

// Inputs scored per template: template id -> that template's inputs.
export type ScoreInputs = Record<string, unknown>;
export type PriorityScores = Record<string, ScoreInputs>;

// An issue as the Product Backlog reads it: the board row plus the product
// fields. Every product field is optional, since board issues never set them.
export type ProductItem = {
  id: string;
  title?: string | null;
  issueKey?: string | null;
  issueType?: string | null;
  priority?: string | null;
  storyPoints?: number | null;
  dueDate?: string | null;
  labels?: string[] | null;
  statusId?: string | null;
  projectId?: string | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  reporterId?: string | null;
  epicId?: string | null;
  parentId?: string | null;
  position?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  stage?: string | null;
  strategicGoalId?: string | null;
  requestSource?: string | null;
  bugSeverity?: string | null;
  whyNow?: string | null;
  successMetric?: string | null;
  userStory?: UserStory | null;
  acceptanceCriteria?: AcceptanceCriterion[] | null;
  readinessChecks?: Record<string, boolean> | null;
  blockedByIssueIds?: string[] | null;
  priorityScores?: PriorityScores | null;
  scoreReasoning?: string | null;
  refinedAt?: string | null;
};

// What a dependency chip needs of the issue on the other end, which may sit
// on the board rather than in the backlog.
export type LinkedIssueSummary = {
  id: string;
  issueKey?: string | null;
  title?: string | null;
  statusId?: string | null;
  stage?: string | null;
};

export type IdeaStatus = 'INBOX' | 'PROMOTED' | 'REJECTED';

export type Idea = {
  id: string;
  title?: string | null;
  description?: string | null;
  source?: string | null;
  requester?: string | null;
  requestCount?: number | null;
  quote?: string | null;
  status?: string | null;
  promotedIssueId?: string | null;
  createdAt?: string | null;
};

export type ProductSprint = BoardSprint & {
  committedPoints?: number | null;
  completedPoints?: number | null;
  committedIssueIds?: string[] | null;
};

export type ProductEpic = BoardEpic & {
  strategicGoalId?: string | null;
};

// Committed and completed points of one finished or running sprint.
export type SprintVelocity = {
  sprintId: string;
  name: string;
  committedPoints: number;
  completedPoints: number;
  isActive: boolean;
};

export type ProductBacklogData = {
  projects: BoardProject[];
  activeProjectId: string | null;
  settings: ProductBacklogSettings;
  issueStatuses: BoardStatus[];
  sprints: ProductSprint[];
  epics: ProductEpic[];
  // Top-level items not archived, plus every top-level issue in a FUTURE
  // sprint, ranked by position.
  items: ProductItem[];
  // Issues of the active sprint, for Sprint Planning and Insights.
  activeSprintIssues: ProductItem[];
  // When each active-sprint issue last entered a done status.
  doneAtByIssueId: Record<string, string>;
  linkedIssues: LinkedIssueSummary[];
  ideas: Idea[];
  velocity: SprintVelocity[];
  members: BoardMember[];
  assignableMembers: BoardMember[];
  currentWorkspaceMemberId: string | null;
  access: ProductBacklogAccess;
  // Admins pick which roles edit or never see the Product Backlog.
  canConfigureAccess: boolean;
  canWrite: boolean;
  canSoftDelete: boolean;
};
