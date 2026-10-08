import { describe, expect, it } from 'vitest';

import {
  BOARD_UNASSIGNED_ASSIGNEE,
  buildBoardColumnFilter,
  buildBoardHiddenDoneFilter,
  buildBoardScopeFilter,
} from '../build-board-issue-filters.util';

const NOW = new Date('2026-10-07T12:00:00.000Z');
const CUTOFF = '2026-09-23T12:00:00.000Z';

const BASE_QUERY = {
  projectId: 'p1',
  sprintId: undefined,
  epicId: undefined,
  assigneeIds: [],
  issueType: null,
};

describe('buildBoardScopeFilter', () => {
  it('adds the epic scope', () => {
    expect(
      buildBoardScopeFilter({ ...BASE_QUERY, epicId: null }).epicId,
    ).toEqual({ is: 'NULL' });
    expect(
      buildBoardScopeFilter({ ...BASE_QUERY, epicId: 'e1' }).epicId,
    ).toEqual({ eq: 'e1' });
  });

  it('scopes to the project alone by default', () => {
    expect(buildBoardScopeFilter(BASE_QUERY)).toEqual({
      projectId: { eq: 'p1' },
    });
  });

  it('adds the sprint scope', () => {
    expect(
      buildBoardScopeFilter({ ...BASE_QUERY, sprintId: null }).sprintId,
    ).toEqual({ is: 'NULL' });
    expect(
      buildBoardScopeFilter({ ...BASE_QUERY, sprintId: 's1' }).sprintId,
    ).toEqual({ eq: 's1' });
  });

  it('filters by assignees and type', () => {
    expect(
      buildBoardScopeFilter({
        ...BASE_QUERY,
        assigneeIds: ['m1', 'm2'],
        issueType: 'BUG',
      }),
    ).toEqual({
      projectId: { eq: 'p1' },
      assigneeId: { in: ['m1', 'm2'] },
      issueType: { eq: 'BUG' },
    });
  });

  it('reads the unassigned pick as an empty assignee', () => {
    expect(
      buildBoardScopeFilter({
        ...BASE_QUERY,
        assigneeIds: [BOARD_UNASSIGNED_ASSIGNEE],
      }),
    ).toEqual({ projectId: { eq: 'p1' }, assigneeId: { is: 'NULL' } });

    expect(
      buildBoardScopeFilter({
        ...BASE_QUERY,
        assigneeIds: ['m1', BOARD_UNASSIGNED_ASSIGNEE],
      }),
    ).toEqual({
      projectId: { eq: 'p1' },
      or: [{ assigneeId: { in: ['m1'] } }, { assigneeId: { is: 'NULL' } }],
    });
  });
});

describe('buildBoardColumnFilter', () => {
  const scopeFilter = { projectId: { eq: 'p1' } };

  it('reads one open status', () => {
    expect(
      buildBoardColumnFilter({
        scopeFilter,
        statusId: 'todo',
        isDoneStatus: false,
        shouldIncludeOlderDone: false,
        now: NOW,
      }),
    ).toEqual({ projectId: { eq: 'p1' }, statusId: { eq: 'todo' } });
  });

  it('reads the issues with no status', () => {
    expect(
      buildBoardColumnFilter({
        scopeFilter,
        statusId: null,
        isDoneStatus: false,
        shouldIncludeOlderDone: false,
        now: NOW,
      }),
    ).toEqual({ projectId: { eq: 'p1' }, statusId: { is: 'NULL' } });
  });

  it('keeps a done column to its recent issues unless asked otherwise', () => {
    expect(
      buildBoardColumnFilter({
        scopeFilter,
        statusId: 'done',
        isDoneStatus: true,
        shouldIncludeOlderDone: false,
        now: NOW,
      }),
    ).toEqual({
      projectId: { eq: 'p1' },
      statusId: { eq: 'done' },
      updatedAt: { gte: CUTOFF },
    });

    expect(
      buildBoardColumnFilter({
        scopeFilter,
        statusId: 'done',
        isDoneStatus: true,
        shouldIncludeOlderDone: true,
        now: NOW,
      }),
    ).toEqual({ projectId: { eq: 'p1' }, statusId: { eq: 'done' } });
  });
});

describe('buildBoardHiddenDoneFilter', () => {
  const scopeFilter = { projectId: { eq: 'p1' } };

  it('counts the done issues past the window', () => {
    expect(
      buildBoardHiddenDoneFilter({
        scopeFilter,
        doneStatusIds: ['done'],
        shouldIncludeOlderDone: false,
        now: NOW,
      }),
    ).toEqual({
      projectId: { eq: 'p1' },
      statusId: { in: ['done'] },
      updatedAt: { lt: CUTOFF },
    });
  });

  it('hides nothing when older issues are shown or nothing is done', () => {
    expect(
      buildBoardHiddenDoneFilter({
        scopeFilter,
        doneStatusIds: ['done'],
        shouldIncludeOlderDone: true,
        now: NOW,
      }),
    ).toBeNull();
    expect(
      buildBoardHiddenDoneFilter({
        scopeFilter,
        doneStatusIds: [],
        shouldIncludeOlderDone: false,
        now: NOW,
      }),
    ).toBeNull();
  });
});
