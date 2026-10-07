import { BOARD_DONE_ISSUE_VISIBLE_DAYS } from '../../constants/board-done-issue-visible-days';

type BoardStatus = { id: string; category?: string | null };

type IssueFilter = Record<string, unknown>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// The board's issue reads. A long-lived project is mostly finished work — the
// biggest one in production is 98% done — and drawing every closed card is
// what made the board slow. So, like Jira, a done issue only stays on the
// board for a while after its last update; the rest is counted, not loaded,
// and fetched only when the reader asks for it.
//
// updatedAt stands in for "when it was done": the issue has no resolution
// date of its own.
export const buildBoardIssueFilters = ({
  projectId,
  sprintId,
  statuses,
  shouldIncludeOlderDone,
  now,
}: {
  projectId: string;
  // undefined = every sprint, null = backlog (no sprint), string = one sprint.
  sprintId: string | null | undefined;
  statuses: readonly BoardStatus[];
  shouldIncludeOlderDone: boolean;
  now: Date;
}): { visibleFilter: IssueFilter; hiddenDoneFilter: IssueFilter | null } => {
  const scopeFilter: IssueFilter = {
    projectId: { eq: projectId },
    ...(sprintId === undefined
      ? {}
      : sprintId === null
        ? { sprintId: { is: 'NULL' } }
        : { sprintId: { eq: sprintId } }),
  };

  const doneStatusIds = statuses
    .filter((status) => status.category === 'DONE')
    .map((status) => status.id);

  if (shouldIncludeOlderDone || doneStatusIds.length === 0) {
    return { visibleFilter: scopeFilter, hiddenDoneFilter: null };
  }

  const openStatusIds = statuses
    .filter((status) => status.category !== 'DONE')
    .map((status) => status.id);
  const cutoff = new Date(
    now.getTime() - BOARD_DONE_ISSUE_VISIBLE_DAYS * DAY_IN_MS,
  ).toISOString();

  return {
    visibleFilter: {
      ...scopeFilter,
      // Spelled out rather than `not: { statusId: { in: done } }`: in SQL that
      // drops the issues with no status at all, which must stay visible.
      or: [
        ...(openStatusIds.length === 0
          ? []
          : [{ statusId: { in: openStatusIds } }]),
        { statusId: { is: 'NULL' } },
        { updatedAt: { gte: cutoff } },
      ],
    },
    hiddenDoneFilter: {
      ...scopeFilter,
      statusId: { in: doneStatusIds },
      updatedAt: { lt: cutoff },
    },
  };
};
