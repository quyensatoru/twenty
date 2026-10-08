import { BOARD_DONE_ISSUE_VISIBLE_DAYS } from '../../constants/board-done-issue-visible-days';

type IssueFilter = Record<string, unknown>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// The avatar filter's "Unassigned" pick, sent alongside member ids.
export const BOARD_UNASSIGNED_ASSIGNEE = 'UNASSIGNED';

export type BoardIssueQuery = {
  projectId: string;
  // undefined = every sprint, null = backlog (no sprint), string = one sprint.
  sprintId: string | null | undefined;
  // undefined = every epic, null = no epic, string = one epic.
  epicId: string | null | undefined;
  // Member ids, optionally with BOARD_UNASSIGNED_ASSIGNEE. Empty = everyone.
  assigneeIds: readonly string[];
  issueType: string | null;
};

const readDoneCutoff = (now: Date): string =>
  new Date(now.getTime() - BOARD_DONE_ISSUE_VISIBLE_DAYS * DAY_IN_MS).toISOString();

const buildAssigneeFilter = (assigneeIds: readonly string[]): IssueFilter => {
  const memberIds = assigneeIds.filter(
    (assigneeId) => assigneeId !== BOARD_UNASSIGNED_ASSIGNEE,
  );
  const includesUnassigned = memberIds.length !== assigneeIds.length;

  if (assigneeIds.length === 0) {
    return {};
  }

  if (memberIds.length === 0) {
    return { assigneeId: { is: 'NULL' } };
  }

  return includesUnassigned
    ? { or: [{ assigneeId: { in: memberIds } }, { assigneeId: { is: 'NULL' } }] }
    : { assigneeId: { in: memberIds } };
};

// Everything a board read shares, whichever column it is for. The filters
// apply on the server because a column only ever holds its first pages: a
// filter run over the loaded cards would miss every card not loaded yet.
export const buildBoardScopeFilter = ({
  projectId,
  sprintId,
  epicId,
  assigneeIds,
  issueType,
}: BoardIssueQuery): IssueFilter => ({
  projectId: { eq: projectId },
  ...(sprintId === undefined
    ? {}
    : sprintId === null
      ? { sprintId: { is: 'NULL' } }
      : { sprintId: { eq: sprintId } }),
  ...(epicId === undefined
    ? {}
    : epicId === null
      ? { epicId: { is: 'NULL' } }
      : { epicId: { eq: epicId } }),
  ...buildAssigneeFilter(assigneeIds),
  ...(issueType === null ? {} : { issueType: { eq: issueType } }),
});

// One column's issues. A long-lived project is mostly finished work — the
// biggest one in production is 98% done — so, like Jira, a done issue only
// stays on the board for a while after its last update; the rest is counted,
// not loaded, and fetched only when the reader asks for it. updatedAt stands
// in for "when it was done": the issue has no resolution date of its own.
export const buildBoardColumnFilter = ({
  scopeFilter,
  statusId,
  isDoneStatus,
  shouldIncludeOlderDone,
  now,
}: {
  scopeFilter: IssueFilter;
  // null = the issues with no status at all.
  statusId: string | null;
  isDoneStatus: boolean;
  shouldIncludeOlderDone: boolean;
  now: Date;
}): IssueFilter => ({
  ...scopeFilter,
  statusId: statusId === null ? { is: 'NULL' } : { eq: statusId },
  ...(isDoneStatus && !shouldIncludeOlderDone
    ? { updatedAt: { gte: readDoneCutoff(now) } }
    : {}),
});

// The done issues the window leaves out, for the count on the done column.
export const buildBoardHiddenDoneFilter = ({
  scopeFilter,
  doneStatusIds,
  shouldIncludeOlderDone,
  now,
}: {
  scopeFilter: IssueFilter;
  doneStatusIds: readonly string[];
  shouldIncludeOlderDone: boolean;
  now: Date;
}): IssueFilter | null =>
  shouldIncludeOlderDone || doneStatusIds.length === 0
    ? null
    : {
        ...scopeFilter,
        statusId: { in: [...doneStatusIds] },
        updatedAt: { lt: readDoneCutoff(now) },
      };
