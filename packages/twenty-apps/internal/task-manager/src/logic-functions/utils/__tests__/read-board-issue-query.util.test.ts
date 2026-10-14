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

  it('reads a known priority and drops anything else', () => {
    expect(readBoardIssueQuery('p1', {}).priority).toBeNull();
    expect(readBoardIssueQuery('p1', { priority: 'HIGH' }).priority).toBe(
      'HIGH',
    );
    expect(
      readBoardIssueQuery('p1', { priority: 'URGENT' }).priority,
    ).toBeNull();
  });

  it('reads the sort rules, dropping unknown, repeated and extra ones', () => {
    expect(readBoardIssueQuery('p1', {}).sort).toEqual([]);
    expect(
      readBoardIssueQuery('p1', {
        sort: [
          { field: 'priority', direction: 'desc' },
          { field: 'title; drop', direction: 'asc' },
          { field: 'priority', direction: 'asc' },
          { field: 'createdAt', direction: 'sideways' },
          { field: 'dueDate', direction: 'asc' },
          { field: 'storyPoints', direction: 'desc' },
        ],
      }).sort,
    ).toEqual([
      { field: 'priority', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' },
      { field: 'dueDate', direction: 'asc' },
    ]);
  });

  it('treats a malformed sort as no sort', () => {
    expect(readBoardIssueQuery('p1', { sort: 'priority' }).sort).toEqual([]);
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
