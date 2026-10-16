import { describe, expect, it } from 'vitest';

import { type IssueRow } from '../../../types/task-manager-rows';
import { pickTaskTodaySuggestion } from '../pick-task-today-suggestion.util';

const DAY = '2026-10-16';
const ISSUE_STATUSES = [
  { id: 'todo', category: 'TODO' },
  { id: 'done', category: 'DONE' },
];

// Local noon keeps the due day the same in every time zone the tests run in.
const buildIssue = (
  id: string,
  dueDay: string | null,
  overrides: Partial<IssueRow> = {},
): IssueRow => ({
  id,
  issueKey: id.toUpperCase(),
  statusId: 'todo',
  dueDate: dueDay === null ? null : `${dueDay}T12:00:00`,
  ...overrides,
});

const pick = (issues: IssueRow[]) =>
  pickTaskTodaySuggestion({ issues, issueStatuses: ISSUE_STATUSES, day: DAY });

describe('pickTaskTodaySuggestion', () => {
  it('suggests the issue overdue the longest', () => {
    expect(
      pick([
        buildIssue('dp-1', '2026-10-15', { priority: 'HIGHEST' }),
        buildIssue('dp-2', '2026-10-10', { priority: 'LOW' }),
        buildIssue('dp-3', DAY, { priority: 'HIGHEST' }),
      ]),
    ).toEqual({
      issue: expect.objectContaining({ id: 'dp-2' }),
      reason: 'overdue',
    });
  });

  it('breaks a tie on the due date by priority', () => {
    expect(
      pick([
        buildIssue('dp-1', '2026-10-10', { priority: 'MEDIUM' }),
        buildIssue('dp-2', '2026-10-10', { priority: 'HIGHEST' }),
        buildIssue('dp-3', '2026-10-10'),
      ])?.issue.id,
    ).toBe('dp-2');
  });

  it('falls back to the most pressing issue due today', () => {
    expect(
      pick([
        buildIssue('dp-1', DAY, { priority: 'LOW' }),
        buildIssue('dp-2', DAY, { priority: 'HIGH' }),
        buildIssue('dp-3', '2026-10-18', { priority: 'HIGHEST' }),
      ]),
    ).toEqual({
      issue: expect.objectContaining({ id: 'dp-2' }),
      reason: 'today',
    });
  });

  it('skips done issues and issues without a due date', () => {
    expect(
      pick([
        buildIssue('dp-1', '2026-10-01', { statusId: 'done' }),
        buildIssue('dp-2', null),
        buildIssue('dp-3', DAY),
      ])?.issue.id,
    ).toBe('dp-3');
  });

  it('suggests nothing when nothing is overdue or due today', () => {
    expect(
      pick([buildIssue('dp-1', '2026-10-20'), buildIssue('dp-2', null)]),
    ).toBeNull();
    expect(pick([])).toBeNull();
  });
});
