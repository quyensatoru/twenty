import { type IssueDevelopmentSummary } from './issue-development-summary';

// Rows the task-board route returns, shaped for the Jira-style board page.
// Narrower than IssueRow on purpose: a card renders key, title, type,
// priority, points, due date, labels, epic, status and owner — never the rich text
// body, which would multiply the payload once per row.
export type BoardIssue = {
  developmentSummary?: IssueDevelopmentSummary;
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
};

export type BoardProject = {
  id: string;
  name?: string | null;
  key?: string | null;
  // Raw JSON; read through readIssueViewSettings.
  issueViewSettings?: unknown;
};

export type BoardStatus = {
  id: string;
  name?: string | null;
  color?: string | null;
  category?: string | null;
  position?: number | null;
};

export type BoardSprint = {
  id: string;
  name?: string | null;
  state?: string | null;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  completeDate?: string | null;
  position?: number | null;
};

export type BoardEpic = {
  id: string;
  name?: string | null;
  color?: string | null;
  assigneeId?: string | null;
  position?: number | null;
};

// Progress of one epic for the epic panel: issues in a DONE-category status
// over all its issues.
export type EpicSummary = {
  epicId: string;
  doneCount: number;
  totalCount: number;
};

export type BoardViewMode = 'board' | 'backlog';

// The page's side padding. The host frame already adds a strip on the left,
// beside the sidebar, so the left one is smaller to look the same.
export type PageInset = { left: number; right: number };

// Names a card has to label: the members behind its assignee and reporter
// ids. Field-for-field compatible with MemberRow in
// front-components/hooks/use-issue-detail, so the detail drawer can hand its
// own member map straight to the shared feed lists.
export type BoardMember = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  avatarUrl?: string | null;
  userEmail?: string | null;
};

// Where a board column stands in its paging: how many issues it holds in
// all, and the cursor its next page starts from.
export type BoardColumnPage = {
  totalCount: number;
  endCursor: string | null;
  hasNextPage: boolean;
};

export type BoardData = {
  projects: BoardProject[];
  activeProjectId: string | null;
  issueStatuses: BoardStatus[];
  sprints: BoardSprint[];
  // The project's ACTIVE sprint, whatever the sprint filter shows.
  activeSprintId: string | null;
  epics: BoardEpic[];
  // The first page of every column, then whatever scrolling has added.
  issues: BoardIssue[];
  // Keyed by status id, or NO_STATUS for the issues with no status.
  columnPages: Record<string, BoardColumnPage>;
  members: BoardMember[];
  // Everyone who can work on the project: the assignee filter's faces.
  assignableMembers: BoardMember[];
  currentWorkspaceMemberId: string | null;
  // Done issues left off the board for being older than its window.
  hiddenDoneIssueCount: number;
  // What the caller may change on the active project's board.
  canWrite: boolean;
  canSoftDelete: boolean;
  // The role's "Manage Views": may change what everyone sees of the board,
  // such as its column order.
  canManageViews: boolean;
};

// What the board-column-issues route answers: one more page of one column.
export type BoardColumnIssuesResponse = BoardColumnPage & {
  issues: BoardIssue[];
  members: BoardMember[];
};

// What the search-issues route answers: one page of matches across every
// project the caller may read, with the lookup lists a result row renders
// (status pill, assignee avatar, project key). Narrower than BoardData on
// purpose — no epics, no sprints, no full board payload per keystroke.
export type IssueSearchResponse = {
  issues: BoardIssue[];
  projects: BoardProject[];
  issueStatuses: BoardStatus[];
  members: BoardMember[];
  hasMore: boolean;
};
