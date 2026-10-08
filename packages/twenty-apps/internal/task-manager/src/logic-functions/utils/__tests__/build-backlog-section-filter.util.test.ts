import { describe, expect, it } from 'vitest';

import {
  buildBacklogSectionFilter,
  unfilterBoardIssueQuery,
} from '../build-backlog-section-filter.util';

const QUERY = {
  projectId: 'p1',
  sprintId: undefined,
  epicId: 'e1',
  assigneeIds: ['m1'],
  issueType: 'BUG',
};

describe('buildBacklogSectionFilter', () => {
  it('lists the top-level issues of a sprint, done ones included', () => {
    expect(
      buildBacklogSectionFilter({
        query: QUERY,
        sprintId: 's1',
        doneStatusIds: ['done'],
      }),
    ).toEqual({
      and: [
        {
          projectId: { eq: 'p1' },
          sprintId: { eq: 's1' },
          epicId: { eq: 'e1' },
          assigneeId: { in: ['m1'] },
          issueType: { eq: 'BUG' },
        },
        { parentId: { is: 'NULL' } },
      ],
    });
  });

  it('leaves finished work out of the backlog, keeping issues with no status', () => {
    const filter = buildBacklogSectionFilter({
      query: unfilterBoardIssueQuery(QUERY),
      sprintId: null,
      doneStatusIds: ['done'],
    });

    expect(filter).toEqual({
      and: [
        { projectId: { eq: 'p1' }, sprintId: { is: 'NULL' } },
        { parentId: { is: 'NULL' } },
        {
          or: [
            { statusId: { is: 'NULL' } },
            { not: { statusId: { in: ['done'] } } },
          ],
        },
      ],
    });
  });
});
