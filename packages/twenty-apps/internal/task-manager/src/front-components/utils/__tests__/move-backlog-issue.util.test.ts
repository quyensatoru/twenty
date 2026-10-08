import { describe, expect, it } from 'vitest';

import { type BacklogSection } from '../../../types/backlog';
import { moveBacklogIssue } from '../move-backlog-issue.util';

const section = (
  key: string,
  sprintId: string | null,
  issues: { id: string; storyPoints?: number }[],
): BacklogSection => ({
  key,
  sprintId,
  issues: issues.map((issue) => ({ ...issue, sprintId })),
  totalCount: issues.length,
  unfilteredCount: issues.length,
  storyPointTotal: issues.reduce((sum, issue) => sum + (issue.storyPoints ?? 0), 0),
  endCursor: null,
  hasNextPage: false,
});

const SECTIONS = [
  section('s1', 's1', [{ id: 'a', storyPoints: 3 }, { id: 'b' }]),
  section('BACKLOG', null, [{ id: 'c' }, { id: 'd' }]),
];

const readIds = (sections: BacklogSection[]) =>
  sections.map((current) => current.issues.map((issue) => issue.id));

describe('moveBacklogIssue', () => {
  it('moves a row to the end of another section with its totals', () => {
    const moved = moveBacklogIssue({
      sections: SECTIONS,
      issueId: 'a',
      targetSectionKey: 'BACKLOG',
      beforeIssueId: null,
    });

    expect(readIds(moved)).toEqual([['b'], ['c', 'd', 'a']]);
    expect(moved[1]?.issues[2]?.sprintId).toBeNull();
    expect(moved[0]?.totalCount).toBe(1);
    expect(moved[0]?.storyPointTotal).toBe(0);
    expect(moved[1]?.totalCount).toBe(3);
    expect(moved[1]?.storyPointTotal).toBe(3);
  });

  it('places a row before the one it was dropped on', () => {
    expect(
      readIds(
        moveBacklogIssue({
          sections: SECTIONS,
          issueId: 'd',
          targetSectionKey: 's1',
          beforeIssueId: 'b',
        }),
      ),
    ).toEqual([['a', 'd', 'b'], ['c']]);
  });

  it('reorders inside a section without touching its totals', () => {
    const moved = moveBacklogIssue({
      sections: SECTIONS,
      issueId: 'b',
      targetSectionKey: 's1',
      beforeIssueId: 'a',
    });

    expect(readIds(moved)).toEqual([['b', 'a'], ['c', 'd']]);
    expect(moved[0]?.totalCount).toBe(2);
  });

  it('returns the same sections when nothing moves', () => {
    expect(
      moveBacklogIssue({
        sections: SECTIONS,
        issueId: 'a',
        targetSectionKey: 's1',
        beforeIssueId: 'b',
      }),
    ).toBe(SECTIONS);
    expect(
      moveBacklogIssue({
        sections: SECTIONS,
        issueId: 'missing',
        targetSectionKey: 's1',
        beforeIssueId: null,
      }),
    ).toBe(SECTIONS);
  });
});
