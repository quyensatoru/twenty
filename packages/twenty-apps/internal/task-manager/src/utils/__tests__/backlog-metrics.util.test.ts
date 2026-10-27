import { describe, expect, it } from 'vitest';

import {
  averageVelocity,
  buildSprintBurndown,
  isItemStale,
} from '../product-backlog/backlog-metrics.util';

describe('averageVelocity', () => {
  it('averages the last finished sprints and ignores the active one', () => {
    const sprint = (completedPoints: number, isActive = false) => ({
      sprintId: String(completedPoints),
      name: `Sprint ${completedPoints}`,
      committedPoints: 30,
      completedPoints,
      isActive,
    });

    expect(
      averageVelocity([
        sprint(100),
        sprint(20),
        sprint(25),
        sprint(31),
        sprint(5, true),
      ]),
    ).toBe(25);
    expect(averageVelocity([sprint(5, true)])).toBe(0);
  });
});

describe('buildSprintBurndown', () => {
  it('draws ideal and remaining over a 3-day sprint', () => {
    const burndown = buildSprintBurndown({
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-03T00:00:00.000Z',
      items: [
        { id: 'a', storyPoints: 5 },
        { id: 'b', storyPoints: 3 },
        { id: 'added', storyPoints: 2 },
      ],
      committedIssueIds: ['a', 'b'],
      doneAtByIssueId: { a: '2026-10-01T15:00:00.000Z' },
      today: new Date('2026-10-02T09:00:00.000Z'),
    });

    expect(burndown.initialScope).toBe(8);
    expect(burndown.rows).toEqual([
      { date: '2026-10-01', ideal: 8, remaining: 5, scope: 10 },
      { date: '2026-10-02', ideal: 4, remaining: 5, scope: 10 },
      { date: '2026-10-03', ideal: 0, remaining: null, scope: null },
    ]);
  });

  it('takes every item as committed when none were recorded', () => {
    expect(
      buildSprintBurndown({
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        items: [{ id: 'a', storyPoints: 5 }],
        committedIssueIds: null,
        doneAtByIssueId: {},
        today: new Date('2026-10-05T00:00:00.000Z'),
      }).initialScope,
    ).toBe(5);
  });
});

describe('isItemStale', () => {
  const now = new Date('2026-10-26T00:00:00.000Z');

  it('reads the refined date before the updated date', () => {
    expect(
      isItemStale(
        {
          id: 'item',
          refinedAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        now,
      ),
    ).toBe(false);
    expect(
      isItemStale({ id: 'item', updatedAt: '2026-01-01T00:00:00.000Z' }, now),
    ).toBe(true);
  });
});
