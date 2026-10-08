import { BOARD_ACTIVE_SPRINT } from '../../constants/board-active-sprint';
import { type BoardIssueQuery } from './build-board-issue-filters.util';

export type BoardIssueQueryBody = {
  // undefined = every sprint, null = backlog (no sprint), string = one sprint,
  // BOARD_ACTIVE_SPRINT = the project's active sprint.
  sprintId?: string | null;
  // undefined = every epic, null = no epic, string = one epic.
  epicId?: string | null;
  assigneeIds?: unknown;
  issueType?: unknown;
  // Done issues past the board's window are left out unless asked for.
  includeOlderDone?: boolean;
};

export type RequestedBoardIssueQuery = BoardIssueQuery & {
  shouldIncludeOlderDone: boolean;
  isActiveSprintRequested: boolean;
};

// The filters both board routes take, read defensively: anything malformed
// is dropped to "no filter" rather than failing the board.
export const readBoardIssueQuery = (
  projectId: string,
  body: BoardIssueQueryBody | null | undefined,
): RequestedBoardIssueQuery => {
  const isActiveSprintRequested = body?.sprintId === BOARD_ACTIVE_SPRINT;

  return {
    projectId,
    sprintId:
      isActiveSprintRequested || body?.sprintId === undefined
        ? undefined
        : typeof body.sprintId === 'string'
          ? body.sprintId
          : null,
    epicId:
      body?.epicId === undefined
        ? undefined
        : typeof body.epicId === 'string' && body.epicId !== ''
          ? body.epicId
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
    isActiveSprintRequested,
  };
};

// With no active sprint the board shows every issue, like a project that does
// not run sprints at all.
export const applyActiveSprint = <TQuery extends RequestedBoardIssueQuery>(
  query: TQuery,
  activeSprintId: string | null,
): TQuery =>
  query.isActiveSprintRequested
    ? { ...query, sprintId: activeSprintId ?? undefined }
    : query;
