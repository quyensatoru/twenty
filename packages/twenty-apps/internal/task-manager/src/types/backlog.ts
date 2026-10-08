import {
  type BoardIssue,
  type BoardMember,
  type BoardSprint,
} from './task-board';

// The key of the section holding the issues with no sprint.
export const BACKLOG_SECTION_KEY = 'BACKLOG';

// One backlog section: a sprint, or the backlog itself. Totals cover the whole
// section; `totalCount` follows the active filters, `unfilteredCount` and
// `storyPointTotal` do not, the way Jira's sprint header counts.
export type BacklogSection = {
  key: string;
  sprintId: string | null;
  issues: BoardIssue[];
  totalCount: number;
  unfilteredCount: number;
  storyPointTotal: number;
  endCursor: string | null;
  hasNextPage: boolean;
};

export type BacklogData = {
  // ACTIVE first, then FUTURE by position. CLOSED sprints never show.
  sprints: BoardSprint[];
  // One per sprint, in the same order, then the backlog section.
  sections: BacklogSection[];
  members: BoardMember[];
  subtaskCountByIssueId: Record<string, number>;
};

export type BacklogSectionIssuesResponse = {
  issues: BoardIssue[];
  members: BoardMember[];
  subtaskCountByIssueId: Record<string, number>;
  totalCount: number;
  endCursor: string | null;
  hasNextPage: boolean;
};
