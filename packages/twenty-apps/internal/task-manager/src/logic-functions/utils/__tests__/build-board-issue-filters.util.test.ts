import { describe, expect, it } from 'vitest';

import { buildBoardIssueFilters } from '../build-board-issue-filters.util';

const NOW = new Date('2026-10-07T12:00:00.000Z');
const CUTOFF = '2026-09-23T12:00:00.000Z';

const STATUSES = [
  { id: 'todo', category: 'UNSTARTED' },
  { id: 'doing', category: 'STARTED' },
  { id: 'golive', category: null },
  { id: 'done', category: 'DONE' },
];

describe('buildBoardIssueFilters', () => {
  it('keeps open work and only recently updated done issues', () => {
    const { visibleFilter, hiddenDoneFilter } = buildBoardIssueFilters({
      projectId: 'p1',
      sprintId: undefined,
      statuses: STATUSES,
      shouldIncludeOlderDone: false,
      now: NOW,
    });

    expect(visibleFilter).toEqual({
      projectId: { eq: 'p1' },
      or: [
        { statusId: { in: ['todo', 'doing', 'golive'] } },
        { statusId: { is: 'NULL' } },
        { updatedAt: { gte: CUTOFF } },
      ],
    });
    expect(hiddenDoneFilter).toEqual({
      projectId: { eq: 'p1' },
      statusId: { in: ['done'] },
      updatedAt: { lt: CUTOFF },
    });
  });

  it('carries the sprint scope into both filters', () => {
    const { visibleFilter, hiddenDoneFilter } = buildBoardIssueFilters({
      projectId: 'p1',
      sprintId: null,
      statuses: STATUSES,
      shouldIncludeOlderDone: false,
      now: NOW,
    });

    expect(visibleFilter.sprintId).toEqual({ is: 'NULL' });
    expect(hiddenDoneFilter?.sprintId).toEqual({ is: 'NULL' });

    const oneSprint = buildBoardIssueFilters({
      projectId: 'p1',
      sprintId: 's1',
      statuses: STATUSES,
      shouldIncludeOlderDone: false,
      now: NOW,
    });

    expect(oneSprint.visibleFilter.sprintId).toEqual({ eq: 's1' });
  });

  it('loads everything when older done issues are asked for', () => {
    const { visibleFilter, hiddenDoneFilter } = buildBoardIssueFilters({
      projectId: 'p1',
      sprintId: undefined,
      statuses: STATUSES,
      shouldIncludeOlderDone: true,
      now: NOW,
    });

    expect(visibleFilter).toEqual({ projectId: { eq: 'p1' } });
    expect(hiddenDoneFilter).toBeNull();
  });

  it('hides nothing when the project has no done status', () => {
    const { visibleFilter, hiddenDoneFilter } = buildBoardIssueFilters({
      projectId: 'p1',
      sprintId: undefined,
      statuses: [{ id: 'todo', category: 'UNSTARTED' }],
      shouldIncludeOlderDone: false,
      now: NOW,
    });

    expect(visibleFilter).toEqual({ projectId: { eq: 'p1' } });
    expect(hiddenDoneFilter).toBeNull();
  });

  it('still shows issues without a status when every status is done', () => {
    const { visibleFilter } = buildBoardIssueFilters({
      projectId: 'p1',
      sprintId: undefined,
      statuses: [{ id: 'done', category: 'DONE' }],
      shouldIncludeOlderDone: false,
      now: NOW,
    });

    expect(visibleFilter.or).toEqual([
      { statusId: { is: 'NULL' } },
      { updatedAt: { gte: CUTOFF } },
    ]);
  });
});
