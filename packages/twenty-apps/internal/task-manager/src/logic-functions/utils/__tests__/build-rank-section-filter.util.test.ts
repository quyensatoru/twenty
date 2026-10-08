import { describe, expect, it } from 'vitest';

import { buildRankSectionFilter } from '../build-rank-section-filter.util';

describe('buildRankSectionFilter', () => {
  it('ranks among the top-level issues of one sprint', () => {
    expect(
      buildRankSectionFilter({
        projectId: 'p1',
        sprintId: 's1',
        excludedIssueId: 'i1',
      }),
    ).toEqual({
      projectId: { eq: 'p1' },
      parentId: { is: 'NULL' },
      sprintId: { eq: 's1' },
      id: { neq: 'i1' },
    });
  });

  it('ranks the backlog among issues with no sprint', () => {
    expect(
      buildRankSectionFilter({
        projectId: 'p1',
        sprintId: null,
        excludedIssueId: 'i1',
      }).sprintId,
    ).toEqual({ is: 'NULL' });
  });
});
