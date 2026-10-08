import { describe, expect, it } from 'vitest';

import {
  applyActiveSprint,
  readBoardIssueQuery,
} from '../read-board-issue-query.util';

describe('readBoardIssueQuery', () => {
  it('reads the active sprint sentinel as a request, not an id', () => {
    const query = readBoardIssueQuery('p1', { sprintId: 'ACTIVE' });

    expect(query.sprintId).toBeUndefined();
    expect(query.isActiveSprintRequested).toBe(true);
  });

  it('keeps an explicit sprint and the backlog', () => {
    expect(readBoardIssueQuery('p1', { sprintId: 's1' }).sprintId).toBe('s1');
    expect(readBoardIssueQuery('p1', { sprintId: null }).sprintId).toBeNull();
  });

  it('reads the epic filter', () => {
    expect(readBoardIssueQuery('p1', {}).epicId).toBeUndefined();
    expect(readBoardIssueQuery('p1', { epicId: null }).epicId).toBeNull();
    expect(readBoardIssueQuery('p1', { epicId: '' }).epicId).toBeNull();
    expect(readBoardIssueQuery('p1', { epicId: 'e1' }).epicId).toBe('e1');
  });
});

describe('applyActiveSprint', () => {
  it('scopes to the active sprint when one runs', () => {
    const query = readBoardIssueQuery('p1', { sprintId: 'ACTIVE' });

    expect(applyActiveSprint(query, 's9').sprintId).toBe('s9');
  });

  it('shows every issue when no sprint is active', () => {
    const query = readBoardIssueQuery('p1', { sprintId: 'ACTIVE' });

    expect(applyActiveSprint(query, null).sprintId).toBeUndefined();
  });

  it('leaves an explicit sprint alone', () => {
    const query = readBoardIssueQuery('p1', { sprintId: 's1' });

    expect(applyActiveSprint(query, 's9').sprintId).toBe('s1');
  });
});
