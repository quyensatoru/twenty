export const ISSUE_SELECTION = {
  id: true,
  title: true,
  // RICH_TEXT is composite: without naming the sub-fields the description comes
  // back absent and the description widget renders blank.
  description: { blocknote: true, markdown: true },
  issueKey: true,
  issueType: true,
  priority: true,
  resolution: true,
  storyPoints: true,
  labels: true,
  dueDate: true,
  position: true,
  originalEstimateMinutes: true,
  remainingEstimateMinutes: true,
  timeSpentMinutes: true,
  statusId: true,
  projectId: true,
  sprintId: true,
  epicId: true,
  parentId: true,
  assigneeId: true,
  reporterId: true,
  // FILES is composite, like RICH_TEXT above: FileObject carries fileId, label,
  // extension and url.
  files: { fileId: true, label: true, extension: true, url: true },
  createdAt: true,
  updatedAt: true,
} as const;

// Cross-project search renders a row, not a card, so it deliberately leaves
// out the RICH_TEXT description: pulling it for fifty rows costs more than
// everything else the result carries.
export const ISSUE_SEARCH_SELECTION = {
  id: true,
  title: true,
  issueKey: true,
  issueType: true,
  priority: true,
  storyPoints: true,
  dueDate: true,
  labels: true,
  statusId: true,
  projectId: true,
  sprintId: true,
  assigneeId: true,
  reporterId: true,
  epicId: true,
  updatedAt: true,
} as const;

// One row of the Subtasks widget: key, title, state and owner, nothing more.
// The status name and the member behind an assigneeId come from the lists the
// issue-detail route already returns, so this selection stays narrow.
export const LINKED_ISSUE_SELECTION = {
  id: true,
  title: true,
  issueKey: true,
  statusId: true,
  assigneeId: true,
} as const;

export const ISSUE_STATUS_SELECTION = {
  id: true,
  name: true,
  color: true,
  category: true,
  position: true,
  projectId: true,
} as const;

export const PROJECT_SELECTION = {
  id: true,
  name: true,
  key: true,
  category: true,
  leadId: true,
  appId: true,
  nextIssueNumber: true,
  issueViewSettings: true,
} as const;

export const SPRINT_SELECTION = {
  id: true,
  name: true,
  state: true,
  goal: true,
  startDate: true,
  endDate: true,
  completeDate: true,
  ownerId: true,
  projectId: true,
  position: true,
} as const;

export const EPIC_SELECTION = {
  id: true,
  name: true,
  assigneeId: true,
  projectId: true,
  position: true,
} as const;

export const ISSUE_COMMENT_SELECTION = {
  id: true,
  issueId: true,
  // RICH_TEXT is composite: without naming the sub-fields the body comes back
  // absent and every comment renders blank.
  bodyV2: { blocknote: true, markdown: true },
  authorId: true,
  parentCommentId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const WORKLOG_SELECTION = {
  id: true,
  description: true,
  timeSpentMinutes: true,
  startedAt: true,
  issueId: true,
  memberId: true,
  createdAt: true,
} as const;

export const ISSUE_HISTORY_SELECTION = {
  id: true,
  issueId: true,
  action: true,
  fromStatusId: true,
  toStatusId: true,
  authorId: true,
  createdAt: true,
} as const;

// The junction rows only: the board needs the issue -> merchant edges, and
// the merchant records behind them are fetched once by id rather than per
// issue.
export const ISSUE_MERCHANT_SELECTION = {
  id: true,
  issueId: true,
  merchantId: true,
} as const;

export const MERCHANT_SELECTION = {
  id: true,
  name: true,
  appId: true,
} as const;
