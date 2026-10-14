import { type BoardIssueSort } from '../constants/board-issue-sorts';
import { type TASK_PERSONAL_BOARD_COLUMNS } from '../constants/task-personal-board';
import {
  type IssueRow,
  type IssueStatusRow,
  type ProjectRow,
} from './task-manager-rows';

export type PersonalBoardColumn = (typeof TASK_PERSONAL_BOARD_COLUMNS)[number];
export type PersonalBoardPlanningColumn = Exclude<PersonalBoardColumn, 'done'>;
export type PersonalBoardPreferences = {
  workView: 'desk' | 'list';
  effectsEnabled?: boolean;
  density: 'comfortable' | 'compact';
  projectId: string | null;
  collapsedColumns: PersonalBoardColumn[];
  // The order the project board's columns are read in.
  boardSort: BoardIssueSort;
};
export type PersonalBoardPlan = {
  column: PersonalBoardPlanningColumn;
  rank: number;
  isPinned: boolean;
};
export type PersonalBoardStateRow = {
  id: string;
  memberId: string;
  issueId?: string | null;
  configuration?: unknown;
};
export type PersonalBoardData = {
  success: true;
  memberId: string;
  issues: IssueRow[];
  projects: (ProjectRow & { canWrite: boolean })[];
  issueStatuses: IssueStatusRow[];
  plans: Record<string, PersonalBoardPlan>;
  preferences: PersonalBoardPreferences;
  totalCount: number;
  endCursor: string | null;
  hasNextPage: boolean;
};
