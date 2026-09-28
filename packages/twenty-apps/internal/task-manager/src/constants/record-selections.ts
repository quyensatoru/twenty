export const ISSUE_SELECTION = {
  id: true,
  title: true,
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
  createdAt: true,
  updatedAt: true,
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

export const MERCHANT_SELECTION = {
  id: true,
  name: true,
  appId: true,
} as const;
