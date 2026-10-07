import { type BoardIssueQuery } from './build-board-issue-filters.util';

export type BoardIssueQueryBody = {
  // undefined = every sprint, null = backlog (no sprint), string = one sprint.
  sprintId?: string | null;
  assigneeIds?: unknown;
  issueType?: unknown;
  // Done issues past the board's window are left out unless asked for.
  includeOlderDone?: boolean;
};

// The filters both board routes take, read defensively: anything malformed
// is dropped to "no filter" rather than failing the board.
export const readBoardIssueQuery = (
  projectId: string,
  body: BoardIssueQueryBody | null | undefined,
): BoardIssueQuery & { shouldIncludeOlderDone: boolean } => ({
  projectId,
  sprintId:
    body?.sprintId === undefined
      ? undefined
      : typeof body.sprintId === 'string'
        ? body.sprintId
        : null,
  assigneeIds: Array.isArray(body?.assigneeIds)
    ? body.assigneeIds.filter(
        (assigneeId): assigneeId is string =>
          typeof assigneeId === 'string' && assigneeId !== '',
      )
    : [],
  issueType:
    typeof body?.issueType === 'string' && body.issueType !== ''
      ? body.issueType
      : null,
  shouldIncludeOlderDone: body?.includeOlderDone === true,
});
